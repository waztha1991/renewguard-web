import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";

export function SettingsPage() {
  const { me, setMe, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [licKey, setLicKey] = useState("");
  const [licMsg, setLicMsg] = useState("");
  const [licErr, setLicErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [passOk, setPassOk] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  async function onActivate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLicErr("");
    setLicMsg("");
    try {
      await api.activateLicense(me!.agent.id, licKey.trim());
      const next = await refresh();
      setLicMsg(next?.licenseMessage || "Activated");
    } catch (ex) {
      setLicErr(ex instanceof ApiError ? ex.message : "Activation failed");
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPassErr("");
    setPassOk("");
    const fd = new FormData(e.currentTarget);
    const np = String(fd.get("newPassword") || "");
    const np2 = String(fd.get("confirm") || "");
    if (np !== np2) {
      setPassErr("New passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const next = await api.changePassword(String(fd.get("currentPassword") || ""), np);
      setMe(next);
      setPassOk("Password updated");
      e.currentTarget.reset();
    } catch (ex) {
      setPassErr(ex instanceof ApiError ? ex.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const access = me.licensed
    ? "Licensed"
    : me.onTrial
      ? `Trial (${me.trialDaysLeft ?? "?"} days left)`
      : "Expired";

  return (
    <>
      <div className="panel">
        <h2 style={{ marginTop: 0, fontFamily: "var(--display)" }}>Account</h2>
        <dl className="kv">
          <dt>Name</dt>
          <dd>{me.agent.fullName}</dd>
          <dt>Email</dt>
          <dd>{me.agent.email}</dd>
          <dt>Mobile</dt>
          <dd>{me.agent.mobile}</dd>
          <dt>Access</dt>
          <dd>{access}</dd>
          <dt>License</dt>
          <dd>{me.licenseMessage || "—"}</dd>
        </dl>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Activate / renew license</h3>
        <form onSubmit={onActivate}>
          <label htmlFor="setLicKey">License key</label>
          <input
            id="setLicKey"
            value={licKey}
            onChange={(e) => setLicKey(e.target.value.toUpperCase())}
            placeholder="RG-XXXX-XXXX-XXXX"
            style={{ textTransform: "uppercase" }}
            required
          />
          <button type="submit" className="teal" disabled={busy}>
            Activate
          </button>
        </form>
        {licMsg ? <div className="okmsg">{licMsg}</div> : null}
        {licErr ? <div className="err">{licErr}</div> : null}
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Change password</h3>
        <form onSubmit={onChangePassword}>
          <label htmlFor="curPass">Current password</label>
          <input id="curPass" name="currentPassword" type="password" required />
          <label htmlFor="newPass">New password</label>
          <input id="newPass" name="newPassword" type="password" minLength={6} required />
          <label htmlFor="newPass2">Confirm new password</label>
          <input id="newPass2" name="confirm" type="password" minLength={6} required />
          <button type="submit" className="teal" disabled={busy}>
            Update password
          </button>
        </form>
        {passErr ? <div className="err">{passErr}</div> : null}
        {passOk ? <div className="okmsg">{passOk}</div> : null}
      </div>

      <div className="panel">
        <button
          type="button"
          className="danger"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </div>
    </>
  );
}
