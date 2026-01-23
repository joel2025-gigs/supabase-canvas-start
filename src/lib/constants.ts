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

// User roles with labels - New department-based structure
export const USER_ROLES = {
  super_admin: { label: "Super Admin", description: "Full system access" },
  admin: { label: "Admin", description: "OPERATIONS + LOANS access, no ADMIN section" },
  operations_admin: { label: "Operations Admin", description: "Edit OPERATIONS, view-only LOANS" },
  accountant: { label: "Accountant", description: "View-only, can download reports" },
  sales_admin: { label: "Sales Admin", description: "Manage Sales department" },
  sales_officer: { label: "Sales Officer", description: "Basic Sales tasks" },
  credit_admin: { label: "Credit Admin", description: "Final loan approval, manage Credit dept" },
  credit_officer: { label: "Credit Officer", description: "Create loan applications" },
  recovery_admin: { label: "Recovery Admin", description: "Manage Recovery department" },
  recovery_officer: { label: "Recovery Officer", description: "Basic Recovery tasks" },
  operations_officer: { label: "Operations Officer", description: "Basic Operations tasks" },
  staff: { label: "Staff", description: "Department-specific access" },
} as const;

// Department definitions
export const DEPARTMENTS = {
  sales: { label: "Sales", description: "Lead management and client acquisition" },
  credit_collection: { label: "Credit & Collection", description: "Loan processing and payments" },
  recovery: { label: "Recovery", description: "Default management and asset recovery" },
  operations: { label: "Operations", description: "Asset and product management" },
} as const;

// Role to department mapping
export const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  sales_admin: 'sales',
  sales_officer: 'sales',
  credit_admin: 'credit_collection',
  credit_officer: 'credit_collection',
  recovery_admin: 'recovery',
  recovery_officer: 'recovery',
  operations_admin: 'operations',
  operations_officer: 'operations',
};

// Roles that can approve loans (only super_admin and credit_admin)
export const LOAN_APPROVAL_ROLES = ['super_admin', 'credit_admin'] as const;

// Roles that can edit operations
export const OPERATIONS_EDIT_ROLES = ['super_admin', 'admin', 'operations_admin'] as const;

// Roles that can view loans
export const LOANS_VIEW_ROLES = [
  'super_admin', 'admin', 'accountant', 'operations_admin',
  'credit_admin', 'credit_officer', 'recovery_admin', 'recovery_officer'
] as const;

// Admin section visible roles
export const ADMIN_SECTION_ROLES = ['super_admin'] as const;

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

// Asset categories
export const ASSET_CATEGORIES = {
  inventory: { label: "Inventory", description: "Motorcycles/Tricycles for sale" },
  fixed_asset: { label: "Fixed Asset", description: "Office equipment, vehicles, furniture" },
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
