// NAWAP Asset Financing System Types

export type AppRole = 'super_admin' | 'admin' | 'field_officer' | 'accountant' | 'client';
export type LoanStatus = 'pending' | 'under_review' | 'awaiting_asset' | 'awaiting_approval' | 'approved' | 'active' | 'completed' | 'defaulted' | 'recovered';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'reconciled';
export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'cash';
export type AssetStatus = 'available' | 'assigned' | 'recovered' | 'transferred' | 'maintenance';
export type RepaymentFrequency = 'daily' | 'weekly';
export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  district?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  national_id?: string;
  address?: string;
  district?: string;
  avatar_url?: string;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch?: Branch;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by?: string;
  created_at: string;
}

export interface Client {
  id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  phone_secondary?: string;
  national_id?: string;
  address: string;
  district: string;
  village?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  occupation?: string;
  monthly_income?: number;
  photo_url?: string;
  id_photo_url?: string;
  branch_id: string;
  asset_id?: string;
  registered_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sync_status: SyncStatus;
  local_id?: string;
  branch?: Branch;
  asset?: Asset;
}

export interface Asset {
  id: string;
  asset_type: 'motorcycle' | 'tricycle';
  brand: string;
  model: string;
  year?: number;
  chassis_number: string;
  engine_number?: string;
  registration_number?: string;
  color?: string;
  purchase_price: number;
  selling_price: number;
  status: AssetStatus;
  gps_device_id?: string;
  gps_status: string;
  branch_id: string;
  photo_urls?: string[];
  notes?: string;
  registered_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sync_status: SyncStatus;
  local_id?: string;
  branch?: Branch;
}

export interface Loan {
  id: string;
  loan_number: string;
  client_id: string;
  asset_id: string;
  branch_id: string;
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  down_payment: number;
  loan_balance: number;
  repayment_frequency: RepaymentFrequency;
  installment_amount: number;
  total_installments: number;
  installments_paid: number;
  start_date: string;
  end_date: string;
  next_payment_date?: string;
  last_payment_date?: string;
  status: LoanStatus;
  missed_payments: number;
  consecutive_missed: number;
  penalty_amount: number;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  recovery_initiated_at?: string;
  recovery_notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  sync_status: SyncStatus;
  local_id?: string;
  client?: Client;
  asset?: Asset;
  branch?: Branch;
}

export interface RepaymentScheduleItem {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  penalty_amount: number;
  is_paid: boolean;
  paid_at?: string;
  is_overdue: boolean;
  days_overdue: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_reference: string;
  loan_id: string;
  client_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  phone_number?: string;
  status: PaymentStatus;
  received_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  is_reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  reconciliation_notes?: string;
  is_manual_override: boolean;
  override_reason?: string;
  branch_id: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  local_id?: string;
  loan?: Loan;
  client?: Client;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  branch_id?: string;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  local_id: string;
  record_data: Record<string, unknown>;
  synced: boolean;
  synced_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  totalClients: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  pendingPayments: number;
  overdueLoans: number;
  defaultedLoans: number;
  availableAssets: number;
}

// Loan calculation
export interface LoanCalculation {
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  endDate: Date;
}
