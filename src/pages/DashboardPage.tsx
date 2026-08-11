import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { PolicySection } from "../components/PolicyCard";
import { exportCustomersExcel, exportCustomersPdf } from "../exportCustomers";
import type { Policy } from "../types";
import { groupPolicies } from "../utils";

function filteredPolicies(list: Policy[], query: string): Policy[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) =>
    [p.customerName, p.vehicleNumber, p.customerNic, p.customerMobile]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

export function DashboardPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      await refresh();
      setPolicies(await api.policies());
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        navigate("/license");
        return;
      }
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [navigate, refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  const g = groupPolicies(policies, query);
  const exportList = useMemo(() => filteredPolicies(policies, query), [policies, query]);

  function runExport(kind: "excel" | "pdf") {
    setErr("");
    setMsg("");
    try {
      if (kind === "excel") exportCustomersExcel(exportList);
      else exportCustomersPdf(exportList);
      setMsg(
        `Exported ${exportList.length} customer${exportList.length === 1 ? "" : "s"} as ${
          kind === "excel" ? "Excel" : "PDF"
        }`
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <>
      <div className="toolbar">
        <div>
          <label htmlFor="searchQ">Search policies</label>
          <input
            id="searchQ"
            placeholder="Name, vehicle, NIC, mobile"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="secondary" onClick={() => void load()}>
          Refresh
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!exportList.length}
          onClick={() => runExport("excel")}
          title="Download all visible customer details as Excel"
        >
          Export Excel
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!exportList.length}
          onClick={() => runExport("pdf")}
          title="Download all visible customer details as PDF"
        >
          Export PDF
        </button>
      </div>
      {msg ? <div className="okmsg" style={{ marginBottom: 8 }}>{msg}</div> : null}
      <div className="panel">
        {loading ? <p className="empty">Loading…</p> : null}
        {err ? <div className="err">{err}</div> : null}
        {!loading && !policies.length ? (
          <p className="empty">No policies yet. Tap + to create your first intake.</p>
        ) : null}
        <PolicySection title="Expires within 7 days" dot="u7" items={g.expiring7} />
        <PolicySection title="Expires within 15 days" dot="u15" items={g.expiring15} />
        <PolicySection title="Expires within 30 days" dot="u30" items={g.expiring30} />
        <PolicySection title="Expired" dot="uexp" items={g.expired} />
        <PolicySection title="Active" dot="active" items={g.active} />
        <PolicySection title="Drafts" dot="draft" items={g.drafts} />
        <PolicySection title="Renewed" dot="renewed" items={g.renewed} />
      </div>
      <Link to="/policies/new" className="fab" title="New policy">
        +
      </Link>
    </>
  );
}
