import type { Policy } from "./types";

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addYears(iso: string, years: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  const e = new Date(expiry + "T12:00:00");
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  return Math.round((e.getTime() - t.getTime()) / 86400000);
}

export function displayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtWhen(ms: number): string {
  return new Date(ms).toLocaleString();
}

export function isImagePath(path: string | null | undefined): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(path || "");
}

export function normalizeMobile(raw: string): string {
  const digits = String(raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  const d = digits.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) return "+94" + d.slice(1);
  if (d.length === 9) return "+94" + d;
  if (d.length === 11 && d.startsWith("94")) return "+" + d;
  return digits;
}

export function waDigits(mobile: string): string {
  return normalizeMobile(mobile).replace(/\D/g, "");
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function reminderMessage(p: Policy): string {
  const days = daysUntil(p.expiryDate);
  let urgency = "is due for renewal soon";
  if (days == null) urgency = "is due for renewal soon";
  else if (days < 0) urgency = "has expired";
  else if (days === 0) urgency = "expires today";
  else if (days === 1) urgency = "expires tomorrow";
  else urgency = `expires in ${days} days`;
  return (
    `Dear ${p.customerName}, your motor insurance for ${p.vehicleNumber} ${urgency}` +
    ` (${displayDate(p.expiryDate)}). Please contact your agent to renew. Thank you.`
  );
}

export function emptyPolicy(agentId = ""): Policy {
  const today = isoToday();
  return {
    id: uuid(),
    agentId,
    isDraft: false,
    title: "MR",
    customerName: "",
    customerEmail: "",
    customerMobile: "",
    customerNic: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    vehicleType: "MOTOR_BIKE",
    vehicleNumber: "",
    beneficiaryName: "",
    beneficiaryNic: "",
    beneficiaryRelationship: "SPOUSE",
    nicFrontPath: null,
    nicRearPath: null,
    vrcPath: null,
    issueDate: today,
    expiryDate: addYears(today, 1),
    status: "ACTIVE",
    createdAt: 0,
    updatedAt: 0,
    renewedAt: null,
    deleted: false,
  };
}

export type PolicyGroups = {
  expiring7: Policy[];
  expiring15: Policy[];
  expiring30: Policy[];
  expired: Policy[];
  active: Policy[];
  drafts: Policy[];
  renewed: Policy[];
};

export function groupPolicies(list: Policy[], query: string): PolicyGroups {
  const q = query.trim().toLowerCase();
  const filtered = list.filter((p) => {
    if (!q) return true;
    return [p.customerName, p.vehicleNumber, p.customerNic, p.customerMobile]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const drafts: Policy[] = [];
  const renewed: Policy[] = [];
  const expired: Policy[] = [];
  const d7: Policy[] = [];
  const d15: Policy[] = [];
  const d30: Policy[] = [];
  const active: Policy[] = [];

  filtered.forEach((p) => {
    if (p.isDraft) {
      drafts.push(p);
      return;
    }
    if (p.status === "RENEWED") {
      renewed.push(p);
      return;
    }
    const days = daysUntil(p.expiryDate);
    if (days == null) active.push(p);
    else if (days < 0) expired.push(p);
    else if (days <= 7) d7.push(p);
    else if (days <= 15) d15.push(p);
    else if (days <= 30) d30.push(p);
    else active.push(p);
  });

  const byExp = (a: Policy[]) =>
    a.sort((x, y) => (x.expiryDate || "").localeCompare(y.expiryDate || ""));

  return {
    expiring7: byExp(d7),
    expiring15: byExp(d15),
    expiring30: byExp(d30),
    expired: byExp(expired),
    active: byExp(active),
    drafts: drafts.sort((a, b) => b.updatedAt - a.updatedAt),
    renewed: renewed.sort(
      (a, b) => (b.renewedAt || b.updatedAt) - (a.renewedAt || a.updatedAt)
    ),
  };
}
