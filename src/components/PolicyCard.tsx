import { Link } from "react-router-dom";
import type { Policy } from "../types";
import { daysUntil, displayDate, normalizeMobile } from "../utils";

export function PolicyCard({ policy }: { policy: Policy }) {
  const days = daysUntil(policy.expiryDate);
  const dayLabel =
    days == null
      ? ""
      : days < 0
        ? `${Math.abs(days)}d overdue`
        : `${days}d left`;
  const mobile = policy.customerMobile
    ? normalizeMobile(policy.customerMobile)
    : "";

  return (
    <div className="policy-card" style={{ cursor: "default" }}>
      <Link
        to={`/policies/${policy.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <h3>{policy.customerName || "Untitled"}</h3>
        <div className="meta">
          {policy.vehicleNumber} · {policy.vehicleType.replace(/_/g, " ")} · Exp{" "}
          {displayDate(policy.expiryDate)}
          {dayLabel ? ` · ${dayLabel}` : ""}
        </div>
        <div style={{ marginTop: 6 }}>
          <span className={`badge ${policy.status}`}>{policy.status}</span>
        </div>
      </Link>
      <div className="row-actions">
        {mobile ? (
          <a href={`tel:${mobile}`}>
            <button className="sm teal" type="button">
              Call
            </button>
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function PolicySection({
  title,
  dot,
  items,
}: {
  title: string;
  dot: string;
  items: Policy[];
}) {
  if (!items.length) return null;
  return (
    <>
      <div className="section-h">
        <span className={`dot ${dot}`} />
        {title} ({items.length})
      </div>
      <div className="policy-list">
        {items.map((p) => (
          <PolicyCard key={p.id} policy={p} />
        ))}
      </div>
    </>
  );
}
