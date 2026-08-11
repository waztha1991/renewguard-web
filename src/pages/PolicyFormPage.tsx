import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError, fileUrl } from "../api";
import { useAuth } from "../auth";
import type { Policy } from "../types";
import {
  POLICY_STATUSES,
  RELATIONSHIPS,
  TITLES,
  VEHICLES,
} from "../types";
import { addYears, emptyPolicy, isImagePath } from "../utils";

type DocKey = "nicFrontPath" | "nicRearPath" | "vrcPath";

function DocField({
  label,
  docKey,
  path,
  onUploaded,
}: {
  label: string;
  docKey: DocKey;
  path: string | null | undefined;
  onUploaded: (key: DocKey, path: string) => void;
}) {
  const url = fileUrl(path);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div className="doc-row">
      {url ? (
        isImagePath(path) ? (
          <img className="thumb" src={url} alt={label} />
        ) : (
          <a className="thumb-link" href={url} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        )
      ) : (
        <span className="thumb-link">None</span>
      )}
      <div style={{ flex: 1, minWidth: 160 }}>
        <label>{label}</label>
        <input
          type="file"
          accept="image/*,.pdf"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setErr("");
            try {
              const up = await api.upload(file);
              onUploaded(docKey, up.path);
            } catch (ex) {
              setErr(ex instanceof Error ? ex.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
        />
        {err ? <div className="err">{err}</div> : null}
      </div>
    </div>
  );
}

export function PolicyFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { me } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Policy>(() => emptyPolicy(me?.agent.id || ""));
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await api.policy(id);
        if (!cancelled) setForm(p);
      } catch (e) {
        if (e instanceof ApiError && e.status === 402) navigate("/license");
        else if (!cancelled) setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate]);

  function set<K extends keyof Policy>(key: K, value: Policy[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(asDraft: boolean) {
    if (!me) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      if (!form.customerName && !asDraft) throw new Error("Customer name is required");
      const payload: Policy = {
        ...form,
        id: form.id || emptyPolicy().id,
        isDraft: asDraft,
        status: asDraft ? "DRAFT" : form.status === "DRAFT" ? "ACTIVE" : form.status,
        agentId: me.agent.id,
        customerNic: (form.customerNic || "").toUpperCase(),
        vehicleNumber: (form.vehicleNumber || "").toUpperCase(),
        beneficiaryNic: (form.beneficiaryNic || "").toUpperCase(),
        createdAt: form.createdAt || Date.now(),
        updatedAt: Date.now(),
        deleted: false,
      };
      const saved = await api.savePolicy(payload);
      setMsg(asDraft ? "Draft saved" : "Policy saved");
      navigate(`/policies/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) navigate("/license");
      else setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await save(false);
  }

  if (loading) return <div className="panel"><p>Loading…</p></div>;

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0, fontFamily: "var(--display)" }}>
        {isNew ? "New policy intake" : "Edit policy"}
      </h2>
      <form onSubmit={onSubmit}>
        <div className="form-section">
          <h3>Customer</h3>
          <div className="grid-3">
            <div>
              <label htmlFor="title">Title</label>
              <select
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              >
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="span-2">
              <label htmlFor="customerName">Full name</label>
              <input
                id="customerName"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label htmlFor="customerEmail">Email</label>
              <input
                id="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="customerMobile">Mobile</label>
              <input
                id="customerMobile"
                value={form.customerMobile}
                placeholder="07XXXXXXXX"
                onChange={(e) => set("customerMobile", e.target.value)}
              />
            </div>
          </div>
          <label htmlFor="customerNic">NIC</label>
          <input
            id="customerNic"
            value={form.customerNic}
            onChange={(e) => set("customerNic", e.target.value)}
          />
        </div>

        <div className="form-section">
          <h3>Address</h3>
          <label htmlFor="a1">Line 1</label>
          <input
            id="a1"
            value={form.addressLine1}
            onChange={(e) => set("addressLine1", e.target.value)}
          />
          <label htmlFor="a2">Line 2</label>
          <input
            id="a2"
            value={form.addressLine2}
            onChange={(e) => set("addressLine2", e.target.value)}
          />
          <label htmlFor="a3">Line 3</label>
          <input
            id="a3"
            value={form.addressLine3}
            onChange={(e) => set("addressLine3", e.target.value)}
          />
        </div>

        <div className="form-section">
          <h3>Vehicle</h3>
          <div className="grid-2">
            <div>
              <label htmlFor="vehicleType">Type</label>
              <select
                id="vehicleType"
                value={form.vehicleType}
                onChange={(e) => set("vehicleType", e.target.value)}
              >
                {VEHICLES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vehicleNumber">Number</label>
              <input
                id="vehicleNumber"
                value={form.vehicleNumber}
                placeholder="CAA-1234"
                onChange={(e) => set("vehicleNumber", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Beneficiary</h3>
          <label htmlFor="benName">Name</label>
          <input
            id="benName"
            value={form.beneficiaryName}
            onChange={(e) => set("beneficiaryName", e.target.value)}
          />
          <div className="grid-2">
            <div>
              <label htmlFor="benNic">NIC</label>
              <input
                id="benNic"
                value={form.beneficiaryNic}
                onChange={(e) => set("beneficiaryNic", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="benRel">Relationship</label>
              <select
                id="benRel"
                value={form.beneficiaryRelationship}
                onChange={(e) => set("beneficiaryRelationship", e.target.value)}
              >
                {RELATIONSHIPS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Documents</h3>
          <DocField
            label="NIC front"
            docKey="nicFrontPath"
            path={form.nicFrontPath}
            onUploaded={(k, p) => {
              set(k, p);
              setMsg("NIC front uploaded");
            }}
          />
          <DocField
            label="NIC rear"
            docKey="nicRearPath"
            path={form.nicRearPath}
            onUploaded={(k, p) => {
              set(k, p);
              setMsg("NIC rear uploaded");
            }}
          />
          <DocField
            label="VRC"
            docKey="vrcPath"
            path={form.vrcPath}
            onUploaded={(k, p) => {
              set(k, p);
              setMsg("VRC uploaded");
            }}
          />
        </div>

        <div className="form-section">
          <h3>Policy dates</h3>
          <div className="grid-3">
            <div>
              <label htmlFor="issueDate">Issue</label>
              <input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => {
                  const issue = e.target.value;
                  setForm((f) => ({
                    ...f,
                    issueDate: issue,
                    expiryDate: addYears(issue, 1),
                  }));
                }}
              />
            </div>
            <div>
              <label htmlFor="expiryDate">Expiry</label>
              <input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => set("expiryDate", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {POLICY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="teal" disabled={busy}>
            Save policy
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void save(true)}
          >
            Save as draft
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </div>
        {err ? <div className="err">{err}</div> : null}
        {msg ? <div className="okmsg">{msg}</div> : null}
      </form>
    </div>
  );
}
