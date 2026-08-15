import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api";
import type { Announcement } from "../types";

const DISMISSED_KEY = "renewguard.dismissedAnnouncements";

function loadDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

export function AppShell() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed());

  useEffect(() => {
    api
      .announcements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, []);

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
  }

  const visibleAnnouncements = announcements.filter((a) => !dismissed.includes(a.id));

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
      {visibleAnnouncements.map((a) => (
        <div key={a.id} className={`banner announcement ${a.type}`}>
          <span>{a.message}</span>
          <button
            type="button"
            className="announcement-dismiss"
            aria-label="Dismiss"
            onClick={() => dismiss(a.id)}
          >
            ×
          </button>
        </div>
      ))}
      {banner}
      <Outlet />
    </div>
  );
}
