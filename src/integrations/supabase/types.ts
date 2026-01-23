export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_type: string
          branch_id: string
          brand: string
          chassis_number: string
          color: string | null
          created_at: string | null
          deleted_at: string | null
          engine_number: string | null
          gps_device_id: string | null
          gps_status: string | null
          id: string
          local_id: string | null
          model: string
          notes: string | null
          photo_urls: string[] | null
          purchase_price: number
          registered_by: string | null
          registration_number: string | null
          selling_price: number
          status: Database["public"]["Enums"]["asset_status"] | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          asset_type: string
          branch_id: string
          brand: string
          chassis_number: string
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          engine_number?: string | null
          gps_device_id?: string | null
          gps_status?: string | null
          id?: string
          local_id?: string | null
          model: string
          notes?: string | null
          photo_urls?: string[] | null
          purchase_price: number
          registered_by?: string | null
          registration_number?: string | null
          selling_price: number
          status?: Database["public"]["Enums"]["asset_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          asset_type?: string
          branch_id?: string
          brand?: string
          chassis_number?: string
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          engine_number?: string | null
          gps_device_id?: string | null
          gps_status?: string | null
          id?: string
          local_id?: string | null
          model?: string
          notes?: string | null
          photo_urls?: string[] | null
          purchase_price?: number
          registered_by?: string | null
          registration_number?: string | null
          selling_price?: number
          status?: Database["public"]["Enums"]["asset_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          branch_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          code: string
          created_at: string | null
          deleted_at: string | null
          district: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          deleted_at?: string | null
          district?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          district?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          asset_id: string | null
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          district: string
          full_name: string
          id: string
          id_photo_url: string | null
          is_active: boolean | null
          latitude: number | null
          local_id: string | null
          longitude: number | null
          monthly_income: number | null
          national_id: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          occupation: string | null
          phone: string
          phone_secondary: string | null
          photo_url: string | null
          registered_by: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          user_id: string | null
          village: string | null
        }
        Insert: {
          address: string
          asset_id?: string | null
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          district: string
          full_name: string
          id?: string
          id_photo_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          local_id?: string | null
          longitude?: number | null
          monthly_income?: number | null
          national_id?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          occupation?: string | null
          phone: string
          phone_secondary?: string | null
          photo_url?: string | null
          registered_by?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          user_id?: string | null
          village?: string | null
        }
        Update: {
          address?: string
          asset_id?: string | null
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          district?: string
          full_name?: string
          id?: string
          id_photo_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          local_id?: string | null
          longitude?: number | null
          monthly_income?: number | null
          national_id?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          occupation?: string | null
          phone?: string
          phone_secondary?: string | null
          photo_url?: string | null
          registered_by?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          user_id?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          district: string | null
          email: string | null
          followed_up_at: string | null
          followed_up_by: string | null
          full_name: string
          id: string
          message: string | null
          monthly_income: string | null
          notes: string | null
          occupation: string | null
          phone: string
          product_interest: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          followed_up_at?: string | null
          followed_up_by?: string | null
          full_name: string
          id?: string
          message?: string | null
          monthly_income?: string | null
          notes?: string | null
          occupation?: string | null
          phone: string
          product_interest?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          followed_up_at?: string | null
          followed_up_by?: string | null
          full_name?: string
          id?: string
          message?: string | null
          monthly_income?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string
          product_interest?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asset_id: string
          branch_id: string
          client_id: string
          consecutive_missed: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          down_payment: number | null
          end_date: string
          id: string
          installment_amount: number
          installments_paid: number | null
          interest_rate: number | null
          last_payment_date: string | null
          loan_balance: number
          loan_number: string
          local_id: string | null
          missed_payments: number | null
          next_payment_date: string | null
          penalty_amount: number | null
          principal_amount: number
          recovery_initiated_at: string | null
          recovery_notes: string | null
          repayment_frequency: Database["public"]["Enums"]["repayment_frequency"]
          start_date: string
          status: Database["public"]["Enums"]["loan_status"] | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          total_amount: number
          total_installments: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asset_id: string
          branch_id: string
          client_id: string
          consecutive_missed?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          down_payment?: number | null
          end_date: string
          id?: string
          installment_amount: number
          installments_paid?: number | null
          interest_rate?: number | null
          last_payment_date?: string | null
          loan_balance: number
          loan_number: string
          local_id?: string | null
          missed_payments?: number | null
          next_payment_date?: string | null
          penalty_amount?: number | null
          principal_amount: number
          recovery_initiated_at?: string | null
          recovery_notes?: string | null
          repayment_frequency: Database["public"]["Enums"]["repayment_frequency"]
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_amount: number
          total_installments: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asset_id?: string
          branch_id?: string
          client_id?: string
          consecutive_missed?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          down_payment?: number | null
          end_date?: string
          id?: string
          installment_amount?: number
          installments_paid?: number | null
          interest_rate?: number | null
          last_payment_date?: string | null
          loan_balance?: number
          loan_number?: string
          local_id?: string | null
          missed_payments?: number | null
          next_payment_date?: string | null
          penalty_amount?: number | null
          principal_amount?: number
          recovery_initiated_at?: string | null
          recovery_notes?: string | null
          repayment_frequency?: Database["public"]["Enums"]["repayment_frequency"]
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_amount?: number
          total_installments?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          branch_id: string
          client_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: string
          is_manual_override: boolean | null
          is_reconciled: boolean | null
          loan_id: string
          local_id: string | null
          override_reason: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string
          phone_number: string | null
          received_at: string | null
          received_by: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_notes: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          branch_id: string
          client_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          is_manual_override?: boolean | null
          is_reconciled?: boolean | null
          loan_id: string
          local_id?: string | null
          override_reason?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string
          phone_number?: string | null
          received_at?: string | null
          received_by?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          client_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          is_manual_override?: boolean | null
          is_reconciled?: boolean | null
          loan_id?: string
          local_id?: string | null
          override_reason?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string
          phone_number?: string | null
          received_at?: string | null
          received_by?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalog: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asset_type: string
          brand: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          down_payment_percent: number
          features: string[] | null
          id: string
          image_url: string | null
          interest_rate: number | null
          is_featured: boolean | null
          loan_duration_months: number | null
          model: string
          name: string
          price: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["product_status"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asset_type?: string
          brand: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          down_payment_percent?: number
          features?: string[] | null
          id?: string
          image_url?: string | null
          interest_rate?: number | null
          is_featured?: boolean | null
          loan_duration_months?: number | null
          model: string
          name: string
          price: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asset_type?: string
          brand?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          down_payment_percent?: number
          features?: string[] | null
          id?: string
          image_url?: string | null
          interest_rate?: number | null
          is_featured?: boolean | null
          loan_duration_months?: number | null
          model?: string
          name?: string
          price?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["product_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          branch_id: string | null
          created_at: string | null
          deleted_at: string | null
          district: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          national_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          district?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          national_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          national_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      repayment_schedule: {
        Row: {
          amount_due: number
          amount_paid: number | null
          created_at: string | null
          days_overdue: number | null
          due_date: string
          id: string
          installment_number: number
          is_overdue: boolean | null
          is_paid: boolean | null
          loan_id: string
          paid_at: string | null
          penalty_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          created_at?: string | null
          days_overdue?: number | null
          due_date: string
          id?: string
          installment_number: number
          is_overdue?: boolean | null
          is_paid?: boolean | null
          loan_id: string
          paid_at?: string | null
          penalty_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          created_at?: string | null
          days_overdue?: number | null
          due_date?: string
          id?: string
          installment_number?: number
          is_overdue?: boolean | null
          is_paid?: boolean | null
          loan_id?: string
          paid_at?: string | null
          penalty_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repayment_schedule_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          local_id: string
          operation: string
          record_data: Json
          retry_count: number | null
          synced: boolean | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          local_id: string
          operation: string
          record_data: Json
          retry_count?: number | null
          synced?: boolean | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          local_id?: string
          operation?: string
          record_data?: Json
          retry_count?: number | null
          synced?: boolean | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_loan_number: { Args: never; Returns: string }
      generate_payment_reference: { Args: never; Returns: string }
      get_user_branch: { Args: { _user_id: string }; Returns: string }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "field_officer"
        | "accountant"
        | "client"
      asset_status:
        | "available"
        | "assigned"
        | "recovered"
        | "transferred"
        | "maintenance"
      loan_status:
        | "pending"
        | "approved"
        | "active"
        | "completed"
        | "defaulted"
        | "recovered"
        | "under_review"
        | "awaiting_asset"
        | "awaiting_approval"
      payment_method: "mtn_momo" | "airtel_money" | "bank_transfer" | "cash"
      payment_status: "pending" | "confirmed" | "rejected" | "reconciled"
      product_status: "draft" | "pending_review" | "approved" | "rejected"
      repayment_frequency: "daily" | "weekly"
      sync_status: "pending" | "synced" | "conflict"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "field_officer",
        "accountant",
        "client",
      ],
      asset_status: [
        "available",
        "assigned",
        "recovered",
        "transferred",
        "maintenance",
      ],
      loan_status: [
        "pending",
        "approved",
        "active",
        "completed",
        "defaulted",
        "recovered",
        "under_review",
        "awaiting_asset",
        "awaiting_approval",
      ],
      payment_method: ["mtn_momo", "airtel_money", "bank_transfer", "cash"],
      payment_status: ["pending", "confirmed", "rejected", "reconciled"],
      product_status: ["draft", "pending_review", "approved", "rejected"],
      repayment_frequency: ["daily", "weekly"],
      sync_status: ["pending", "synced", "conflict"],
    },
  },
} as const
