// NAWAP Asset Financing System Constants

export const APP_NAME = "NAWAP";
export const APP_FULL_NAME = "NAWAP Asset Financing";
export const APP_TAGLINE = "Empowering Ugandan farmers and boda boda riders";

// Loan configuration
export const INTEREST_RATE = 30; // Fixed 30%
export const DEFAULT_THRESHOLD_WEEKS = 4; // After 4 weeks of consecutive missed payments, flag for recovery

// Repayment frequencies
export const REPAYMENT_FREQUENCIES = {
  daily: { label: "Daily", daysPerPeriod: 1 },
  weekly: { label: "Weekly", daysPerPeriod: 7 },
} as const;

// User roles with labels
export const USER_ROLES = {
  super_admin: { label: "Super Admin", description: "Full system access" },
  admin: { label: "Admin", description: "Approve loans, manage recovery" },
  field_officer: { label: "Field Officer", description: "Client onboarding, payments" },
  accountant: { label: "Accountant", description: "Financial reports, reconciliation" },
  client: { label: "Client", description: "View-only dashboard" },
} as const;

// Loan statuses with labels and colors
export const LOAN_STATUSES = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  defaulted: { label: "Defaulted", color: "bg-red-100 text-red-800" },
  recovered: { label: "Recovered", color: "bg-purple-100 text-purple-800" },
} as const;

// Payment statuses
export const PAYMENT_STATUSES = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  reconciled: { label: "Reconciled", color: "bg-blue-100 text-blue-800" },
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  mtn_momo: { label: "MTN Mobile Money", icon: "📱" },
  airtel_money: { label: "Airtel Money", icon: "📱" },
  bank_transfer: { label: "Bank Transfer", icon: "🏦" },
  cash: { label: "Cash", icon: "💵" },
} as const;

// Asset types
export const ASSET_TYPES = {
  motorcycle: { label: "Motorcycle", icon: "🏍️" },
  tricycle: { label: "Tricycle", icon: "🛺" },
} as const;

// Asset statuses
export const ASSET_STATUSES = {
  available: { label: "Available", color: "bg-green-100 text-green-800" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800" },
  recovered: { label: "Recovered", color: "bg-orange-100 text-orange-800" },
  transferred: { label: "Transferred", color: "bg-purple-100 text-purple-800" },
  maintenance: { label: "Maintenance", color: "bg-gray-100 text-gray-800" },
} as const;

// Districts in Uganda (common ones)
export const DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Mbale", "Gulu", "Lira",
  "Mbarara", "Masaka", "Entebbe", "Soroti", "Tororo", "Arua", "Kabale",
  "Fort Portal", "Hoima", "Kasese", "Moroto", "Kitgum", "Pader"
];
