import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function AppShell() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  const banner =
    me?.onTrial ? (
      <div className="banner trial">
        Free trial — {me.trialDaysLeft ?? "?"} days left. Activate a license anytime in
        Settings.
      </div>
    ) : me?.licensed ? (
      <div className="banner licensed">
        Licensed · {me.licenseMessage || "Active"}
      </div>
    ) : null;

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <p className="eyebrow">Agent portal · AntSolutions</p>
          <h1 className="brand-mark">
            Renew<span>Guard</span>
          </h1>
          <p className="lead">{me ? `Welcome, ${me.agent.fullName}` : ""}</p>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink
            to="/policies/new"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            New policy
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Reports
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Settings
          </NavLink>
          <button
            type="button"
            className="ghost sm"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </nav>
      </div>
      {banner}
      <Outlet />
    </div>
  );
}
