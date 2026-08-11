import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { PolicyCard } from "../components/PolicyCard";
import type { ReportsResponse } from "../types";

export function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.reports();
        if (!cancelled) setReports(r);
      } catch (e) {
        if (e instanceof ApiError && e.status === 402) navigate("/license");
        else if (!cancelled) setErr(e instanceof Error ? e.message : "Failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (err) return <div className="panel"><div className="err">{err}</div></div>;
  if (!reports) return <div className="panel"><p>Loading…</p></div>;

  function block(rep: ReportsResponse["weekly"]) {
    return (
      <div className="panel" key={rep.periodLabel}>
        <h2 style={{ marginTop: 0, fontFamily: "var(--display)" }}>{rep.periodLabel}</h2>
        <div className="stats">
          <div className="stat">
            <b>{rep.upcomingRenewals}</b>
            <span>Upcoming</span>
          </div>
          <div className="stat">
            <b>{rep.renewedCount}</b>
            <span>Renewed*</span>
          </div>
          <div className="stat">
            <b>{rep.lapsedCount}</b>
            <span>Lapsed</span>
          </div>
          <div className="stat">
            <b>{rep.activeCount}</b>
            <span>Active</span>
          </div>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          * Renewed = marked this calendar month
        </p>
        <div className="section-h">
          <span className="dot u30" />
          Upcoming renewals
        </div>
        <div className="policy-list">
          {rep.policies.length ? (
            rep.policies.map((p) => <PolicyCard key={p.id} policy={p} />)
          ) : (
            <p className="empty">None in this window</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {block(reports.weekly)}
      {block(reports.monthly)}
    </>
  );
}
