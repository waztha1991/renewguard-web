import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";

type Mode = "login" | "register" | "forgot";

export function AuthPage({ mode: initial = "login" }: { mode?: Mode }) {
  const { me, setMe, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initial);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="wrap boot">Loading…</div>;
  if (me) {
    return <Navigate to={me.accessGranted ? "/" : "/license"} replace />;
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const next = await api.login(
        String(fd.get("identifier") || ""),
        String(fd.get("password") || "")
      );
      setMe(next);
      navigate(next.accessGranted ? "/" : "/license");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const next = await api.register({
        fullName: String(fd.get("fullName") || ""),
        email: String(fd.get("email") || ""),
        mobile: String(fd.get("mobile") || ""),
        password: String(fd.get("password") || ""),
      });
      setMe(next);
      navigate("/");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.forgotPassword(String(fd.get("identifier") || ""));
      setMsg(res.message || "Request submitted");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="auth-shell">
        <p className="eyebrow">Insurance agents · AntSolutions</p>
        <h1 className="brand-mark">
          Renew<span>Guard</span>
        </h1>
        <p className="lead">
          Track motor renewals, remind customers, and manage your book from any
          browser.
        </p>
        <div className="panel">
          <div className="tabs-row">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setErr("");
                setMsg("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setErr("");
                setMsg("");
              }}
            >
              Register
            </button>
          </div>

          {mode === "forgot" ? (
            <form onSubmit={onForgot}>
              <h2 style={{ marginTop: 0 }}>Forgot password</h2>
              <p className="lead" style={{ marginBottom: 14 }}>
                We’ll notify admin. They’ll set a temporary password and share it
                with you offline.
              </p>
              <label htmlFor="forgotId">Email or mobile</label>
              <input id="forgotId" name="identifier" autoComplete="username" required />
              <button type="submit" style={{ width: "100%" }} disabled={busy}>
                Request reset
              </button>
              <p style={{ marginTop: 12 }}>
                <button type="button" className="linkish" onClick={() => setMode("login")}>
                  Back to sign in
                </button>
              </p>
            </form>
          ) : mode === "register" ? (
            <form onSubmit={onRegister}>
              <label htmlFor="regName">Full name</label>
              <input id="regName" name="fullName" required />
              <label htmlFor="regEmail">Email</label>
              <input id="regEmail" name="email" type="email" autoComplete="email" required />
              <label htmlFor="regMobile">Mobile</label>
              <input
                id="regMobile"
                name="mobile"
                autoComplete="tel"
                placeholder="07XXXXXXXX"
                required
              />
              <label htmlFor="regPass">Password (min 6)</label>
              <input
                id="regPass"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button type="submit" className="teal" style={{ width: "100%" }} disabled={busy}>
                Create account
              </button>
            </form>
          ) : (
            <form onSubmit={onLogin}>
              <label htmlFor="loginId">Email or mobile</label>
              <input id="loginId" name="identifier" autoComplete="username" required />
              <label htmlFor="loginPass">Password</label>
              <input
                id="loginPass"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              <button type="submit" className="teal" style={{ width: "100%" }} disabled={busy}>
                Sign in
              </button>
              <p style={{ marginTop: 12 }}>
                <button type="button" className="linkish" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              </p>
            </form>
          )}

          {err ? <div className="err">{err}</div> : null}
          {msg ? <div className="okmsg">{msg}</div> : null}
        </div>
        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "0.85rem",
            marginTop: 16,
          }}
        >
          Admin panel is at <a href="/admin">/admin</a> ·{" "}
          <Link to="/login">Agent portal</Link>
        </p>
      </div>
    </div>
  );
}
