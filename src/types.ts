export interface Agent {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  enabled: boolean;
  createdAt: number;
  trialStartedAt?: number | null;
  trialExpiresAt?: number | null;
}

export interface License {
  id: string;
  licenseKey: string;
  agentId?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  issuedAt: number;
  activatedAt?: number | null;
  expiresAt?: number | null;
  status: string;
  notes?: string | null;
}

export interface AgentMe {
  agent: Agent;
  licensed: boolean;
  accessGranted: boolean;
  onTrial: boolean;
  trialStartedAt?: number | null;
  trialExpiresAt?: number | null;
  trialDaysLeft?: number | null;
  license?: License | null;
  licenseMessage: string;
}

export interface Policy {
  id: string;
  agentId: string;
  isDraft: boolean;
  title: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerNic: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  vehicleType: string;
  vehicleNumber: string;
  beneficiaryName: string;
  beneficiaryNic: string;
  beneficiaryRelationship: string;
  nicFrontPath?: string | null;
  nicRearPath?: string | null;
  vrcPath?: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  renewedAt?: number | null;
  deleted: boolean;
}

export interface ReminderLog {
  id: string;
  policyId: string;
  agentId: string;
  channel: string;
  message: string;
  daysBeforeExpiry?: number | null;
  sentAt: number;
}

export interface RetentionReport {
  periodLabel: string;
  upcomingRenewals: number;
  renewedCount: number;
  lapsedCount: number;
  activeCount: number;
  policies: Policy[];
}

export interface ReportsResponse {
  weekly: RetentionReport;
  monthly: RetentionReport;
}

export interface UploadResponse {
  path: string;
  url: string;
  fileName: string;
}

export interface LicenseStatus {
  licensed: boolean;
  license?: License | null;
  message: string;
  accessGranted: boolean;
  onTrial: boolean;
  trialStartedAt?: number | null;
  trialExpiresAt?: number | null;
  trialDaysLeft?: number | null;
}

export const TITLES = ["MR", "MRS", "MISS", "MS", "DR", "REV"] as const;
export const VEHICLES = [
  "MOTOR_BIKE",
  "CAR",
  "THREE_WHEELER",
  "VAN",
  "LORRY",
  "BUS",
  "OTHER",
] as const;
export const RELATIONSHIPS = [
  "SPOUSE",
  "CHILD",
  "PARENT",
  "SIBLING",
  "OTHER",
] as const;
export const POLICY_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "EXPIRING_SOON",
  "EXPIRED",
  "RENEWED",
] as const;
