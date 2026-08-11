import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";

export function LicensePage() {
  const { me, setMe, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="wrap boot">Loading…</div>;
  if (!me) return <Navigate to="/login" replace />;
  if (me.accessGranted) return <Navigate to="/" replace />;

  async function onActivate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api.activateLicense(me!.agent.id, key.trim());
      const next = await api.me();
      setMe(next);
      if (next.accessGranted) navigate("/");
      else setMsg(next.licenseMessage || "Activation pending");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Activation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <p className="eyebrow">Agent portal</p>
      <h1 className="brand-mark">
        Renew<span>Guard</span>
      </h1>
      <div className="panel" style={{ maxWidth: 480 }}>
        <h2 style={{ marginTop: 0, fontFamily: "var(--display)" }}>Activate license</h2>
        <p className="lead" style={{ marginBottom: 14 }}>
          {me.licenseMessage ||
            "Your trial has ended. Enter a company license key to continue."}
        </p>
        <form onSubmit={onActivate}>
          <label htmlFor="licKey">License key</label>
          <input
            id="licKey"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="RG-XXXX-XXXX-XXXX"
            style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
            required
          />
          <button type="submit" className="teal" style={{ width: "100%" }} disabled={busy}>
            Activate license
          </button>
        </form>
        {err ? <div className="err">{err}</div> : null}
        {msg ? <div className="okmsg">{msg}</div> : null}
        <p style={{ marginTop: 16 }}>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </p>
      </div>
    </div>
  );
}
