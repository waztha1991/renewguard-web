import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, fileUrl } from "../api";
import { useAuth } from "../auth";
import {
  exportCustomerDetailExcel,
  exportCustomerDetailPdf,
} from "../exportCustomers";
import type { Policy, ReminderLog } from "../types";
import {
  daysUntil,
  displayDate,
  fmtWhen,
  isImagePath,
  normalizeMobile,
  reminderMessage,
  uuid,
  waDigits,
} from "../utils";

function DocPreview({ label, path }: { label: string; path?: string | null }) {
  const url = fileUrl(path);
  if (!url) return <div><div className="thumb-link">No {label}</div></div>;
  if (isImagePath(path)) {
    return (
      <div>
        <img className="thumb" src={url} alt={label} />
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
          {label}
        </div>
      </div>
    );
  }
  return (
    <div>
      <a className="thumb-link" href={url} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </div>
  );
}

export function PolicyDetailPage() {
  const { id = "" } = useParams();
  const { me } = useAuth();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [p, r] = await Promise.all([api.policy(id), api.reminders(id)]);
      setPolicy(p);
      setReminders(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) navigate("/license");
      else setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logChannel(channel: string) {
    if (!policy || !me) return;
    try {
      await api.logReminder({
        id: uuid(),
        policyId: policy.id,
        agentId: me.agent.id,
        channel,
        message: reminderMessage(policy),
        daysBeforeExpiry: daysUntil(policy.expiryDate),
        sentAt: Date.now(),
      });
      setReminders(await api.reminders(policy.id));
      setMsg(`${channel} logged`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Log failed");
    }
  }

  if (loading) return <div className="panel"><p>Loading…</p></div>;
  if (!policy) {
    return (
      <div className="panel">
        <div className="err">{err || "Policy not found"}</div>
        <Link to="/">← Dashboard</Link>
      </div>
    );
  }

  const mobile = normalizeMobile(policy.customerMobile || "");
  const msgEnc = encodeURIComponent(reminderMessage(policy));
  const wa = `https://wa.me/${waDigits(policy.customerMobile || "")}?text=${msgEnc}`;
  const sms = `sms:${mobile}?body=${msgEnc}`;

  return (
    <>
      <div className="topbar">
        <div>
          <button type="button" className="ghost sm" onClick={() => navigate("/")}>
            ← Dashboard
          </button>
          <div className="detail-hero">
            <h2>{policy.customerName}</h2>
            <p>
              {policy.vehicleNumber} · {policy.vehicleType.replace(/_/g, " ")} · Exp{" "}
              {displayDate(policy.expiryDate)}
            </p>
            <p style={{ marginTop: 8 }}>
              <span className={`badge ${policy.status}`}>{policy.status}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row-actions" style={{ marginBottom: 14 }}>
          <a href={`tel:${mobile}`}>
            <button className="teal sm" type="button">
              Call
            </button>
          </a>
          <a href={sms}>
            <button className="secondary sm" type="button">
              SMS
            </button>
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <button className="secondary sm" type="button">
              WhatsApp
            </button>
          </a>
          <button type="button" className="sm" onClick={() => void logChannel("CALL")}>
            Log call
          </button>
          <button type="button" className="sm" onClick={() => void logChannel("SMS")}>
            Log SMS
          </button>
          <button type="button" className="sm" onClick={() => void logChannel("WHATSAPP")}>
            Log WhatsApp
          </button>
        </div>

        <dl className="kv">
          <dt>Mobile</dt>
          <dd>{policy.customerMobile || "—"}</dd>
          <dt>Email</dt>
          <dd>{policy.customerEmail || "—"}</dd>
          <dt>NIC</dt>
          <dd>{policy.customerNic || "—"}</dd>
          <dt>Address</dt>
          <dd>
            {[policy.addressLine1, policy.addressLine2, policy.addressLine3]
              .filter(Boolean)
              .join(", ") || "—"}
          </dd>
          <dt>Beneficiary</dt>
          <dd>
            {policy.beneficiaryName || "—"} ({policy.beneficiaryRelationship})
          </dd>
          <dt>Issue</dt>
          <dd>{displayDate(policy.issueDate)}</dd>
          <dt>Expiry</dt>
          <dd>{displayDate(policy.expiryDate)}</dd>
        </dl>

        <div className="form-section">
          <h3>Documents</h3>
          <div className="doc-row">
            <DocPreview label="NIC front" path={policy.nicFrontPath} />
            <DocPreview label="NIC rear" path={policy.nicRearPath} />
            <DocPreview label="VRC" path={policy.vrcPath} />
          </div>
        </div>

        <div className="row-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="teal"
            onClick={() => navigate(`/policies/${policy.id}/edit`)}
          >
            Edit
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              try {
                exportCustomerDetailExcel(policy);
                setMsg("Customer details exported as Excel");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Excel export failed");
              }
            }}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              try {
                exportCustomerDetailPdf(policy);
                setMsg("Customer details exported as PDF");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "PDF export failed");
              }
            }}
          >
            Export PDF
          </button>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              try {
                const renewed = await api.renewPolicy(policy.id);
                setPolicy(renewed);
                setMsg("Marked renewed — new issue/expiry set for 1 year");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Renew failed");
              }
            }}
          >
            Mark renewed
          </button>
          <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </div>

        <div className="form-section">
          <h3>Reminder history</h3>
          {reminders.length ? (
            reminders.map((r) => (
              <div className="reminder-item" key={r.id}>
                <strong>{r.channel}</strong> · {fmtWhen(r.sentAt)}
                <div style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: 4 }}>
                  {r.message}
                </div>
              </div>
            ))
          ) : (
            <p className="empty">No reminders logged yet.</p>
          )}
        </div>

        {err ? <div className="err">{err}</div> : null}
        {msg ? <div className="okmsg">{msg}</div> : null}
      </div>

      {confirmDelete ? (
        <div className="modal-bg">
          <div className="modal">
            <p>Delete this policy? This cannot be undone from the agent portal.</p>
            <div className="row-actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  try {
                    await api.deletePolicy(policy.id);
                    navigate("/");
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "Delete failed");
                    setConfirmDelete(false);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
