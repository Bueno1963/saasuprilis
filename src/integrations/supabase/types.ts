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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounting_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          credit_account_id: string
          debit_account_id: string
          description: string
          document_number: string | null
          entry_date: string
          id: string
          notes: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_account_id: string
          debit_account_id: string
          description: string
          document_number?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_account_id?: string
          debit_account_id?: string
          description?: string
          document_number?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_batches: {
        Row: {
          batch_number: string
          created_at: string
          created_by: string | null
          glosa_amount: number | null
          id: string
          insurance_plan_id: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          reference_month: string
          sent_at: string | null
          status: string
          tenant_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          created_by?: string | null
          glosa_amount?: number | null
          id?: string
          insurance_plan_id: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          reference_month: string
          sent_at?: string | null
          status?: string
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          created_by?: string | null
          glosa_amount?: number | null
          id?: string
          insurance_plan_id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          reference_month?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_batches_insurance_plan_id_fkey"
            columns: ["insurance_plan_id"]
            isOneToOne: false
            referencedRelation: "insurance_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          category: string
          certificate_number: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          notes: string | null
          related_employee: string | null
          related_equipment: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          notes?: string | null
          related_employee?: string | null
          related_equipment?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          notes?: string | null
          related_employee?: string | null
          related_equipment?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_group: boolean
          level: number
          name: string
          parent_id: string | null
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_group?: boolean
          level?: number
          name: string
          parent_id?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_group?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_maintenance: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          protocol: string | null
          sector: string | null
          serial_number: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_maintenance?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          protocol?: string | null
          sector?: string | null
          serial_number?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_maintenance?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          protocol?: string | null
          sector?: string | null
          serial_number?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_catalog: {
        Row: {
          code: string
          created_at: string
          equipment: string | null
          id: string
          material: string | null
          method: string | null
          name: string
          notes: string | null
          price: number | null
          reference_range: string | null
          section_group: string
          sector: string | null
          status: string
          tenant_id: string | null
          turnaround_hours: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          equipment?: string | null
          id?: string
          material?: string | null
          method?: string | null
          name: string
          notes?: string | null
          price?: number | null
          reference_range?: string | null
          section_group?: string
          sector?: string | null
          status?: string
          tenant_id?: string | null
          turnaround_hours?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          equipment?: string | null
          id?: string
          material?: string | null
          method?: string | null
          name?: string
          notes?: string | null
          price?: number | null
          reference_range?: string | null
          section_group?: string
          sector?: string | null
          status?: string
          tenant_id?: string | null
          turnaround_hours?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_catalog_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_parameters: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          name: string
          reference_range: string | null
          section: string
          sort_order: number | null
          tenant_id: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          name: string
          reference_range?: string | null
          section?: string
          sort_order?: number | null
          tenant_id?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          name?: string
          reference_range?: string | null
          section?: string
          sort_order?: number | null
          tenant_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_parameters_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_parameters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_plan_exams: {
        Row: {
          created_at: string
          description: string
          exam_catalog_id: string | null
          id: string
          insurance_plan_id: string
          price: number
          procedure_code: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          exam_catalog_id?: string | null
          id?: string
          insurance_plan_id: string
          price?: number
          procedure_code: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          exam_catalog_id?: string | null
          id?: string
          insurance_plan_id?: string
          price?: number
          procedure_code?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plan_exams_exam_catalog_id_fkey"
            columns: ["exam_catalog_id"]
            isOneToOne: false
            referencedRelation: "exam_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_plan_exams_insurance_plan_id_fkey"
            columns: ["insurance_plan_id"]
            isOneToOne: false
            referencedRelation: "insurance_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_plan_exams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_plans: {
        Row: {
          billing_type: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          discount_percent: number | null
          id: string
          name: string
          notes: string | null
          payment_deadline_days: number | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          billing_type?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          name: string
          notes?: string | null
          payment_deadline_days?: number | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_type?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          name?: string
          notes?: string | null
          payment_deadline_days?: number | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_logs: {
        Row: {
          created_at: string
          destination_system: string
          direction: string
          duration_ms: number | null
          error_message: string | null
          id: string
          integration_id: string
          message: string
          records_created: number
          records_failed: number
          records_updated: number
          source_system: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          destination_system?: string
          direction?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          integration_id: string
          message?: string
          records_created?: number
          records_failed?: number
          records_updated?: number
          source_system?: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          destination_system?: string
          direction?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          integration_id?: string
          message?: string
          records_created?: number
          records_failed?: number
          records_updated?: number
          source_system?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_key_name: string | null
          created_at: string
          endpoint_url: string | null
          id: string
          last_sync: string | null
          name: string
          notes: string | null
          protocol: string | null
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          api_key_name?: string | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          last_sync?: string | null
          name: string
          notes?: string | null
          protocol?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          api_key_name?: string | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          last_sync?: string | null
          name?: string
          notes?: string | null
          protocol?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_settings: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string
          crm_responsible: string
          daily_appointment_limit: number | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          technical_responsible: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string
          crm_responsible?: string
          daily_appointment_limit?: number | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          technical_responsible?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string
          crm_responsible?: string
          daily_appointment_limit?: number | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          technical_responsible?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedule: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          equipment_name: string | null
          id: string
          maintenance_type: string
          notes: string | null
          recurrence: string | null
          responsible: string | null
          scheduled_date: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          equipment_name?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          recurrence?: string | null
          responsible?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          equipment_name?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          recurrence?: string | null
          responsible?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_name: string
          exams: string[]
          id: string
          insurance: string | null
          order_number: string
          patient_id: string
          priority: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_name?: string
          exams?: string[]
          id?: string
          insurance?: string | null
          order_number: string
          patient_id: string
          priority?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_name?: string
          exams?: string[]
          id?: string
          insurance?: string | null
          order_number?: string
          patient_id?: string
          priority?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      parameter_reference_ranges: {
        Row: {
          age_group: string
          created_at: string
          gender: string
          id: string
          parameter_id: string
          reference_value: string
          sort_order: number | null
          tenant_id: string | null
        }
        Insert: {
          age_group?: string
          created_at?: string
          gender?: string
          id?: string
          parameter_id: string
          reference_value?: string
          sort_order?: number | null
          tenant_id?: string | null
        }
        Update: {
          age_group?: string
          created_at?: string
          gender?: string
          id?: string
          parameter_id?: string
          reference_value?: string
          sort_order?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parameter_reference_ranges_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "exam_parameters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parameter_reference_ranges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string
          city: string | null
          cpf: string
          created_at: string
          created_by: string | null
          email: string | null
          gender: string
          id: string
          insurance: string | null
          name: string
          phone: string | null
          state: string | null
          tenant_id: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          birth_date: string
          city?: string | null
          cpf: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          gender: string
          id?: string
          insurance?: string | null
          name: string
          phone?: string | null
          state?: string | null
          tenant_id?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string
          city?: string | null
          cpf?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          gender?: string
          id?: string
          insurance?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tenant_id?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          recurrence: string | null
          status: string
          supplier: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          recurrence?: string | null
          status?: string
          supplier?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          recurrence?: string | null
          status?: string
          supplier?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          route: string
          target_role: string
          tenant_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          route: string
          target_role: string
          tenant_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          route?: string
          target_role?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pops: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          code: string
          created_at: string
          created_by: string | null
          effective_date: string | null
          id: string
          materials: string | null
          next_review_date: string | null
          objective: string | null
          procedure_steps: string | null
          references_docs: string | null
          responsibilities: string | null
          revision_history: string | null
          safety_notes: string | null
          scope: string | null
          sector: string
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          code: string
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          materials?: string | null
          next_review_date?: string | null
          objective?: string | null
          procedure_steps?: string | null
          references_docs?: string | null
          responsibilities?: string | null
          revision_history?: string | null
          safety_notes?: string | null
          scope?: string | null
          sector?: string
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          materials?: string | null
          next_review_date?: string | null
          objective?: string | null
          procedure_steps?: string | null
          references_docs?: string | null
          responsibilities?: string | null
          revision_history?: string | null
          safety_notes?: string | null
          scope?: string | null
          sector?: string
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "pops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_access_logs: {
        Row: {
          access_ip: string | null
          access_method: string
          accessed_at: string
          created_at: string
          data_returned: Json | null
          doctor_name: string | null
          id: string
          order_id: string | null
          patient_id: string | null
          portal_type: string
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_ip?: string | null
          access_method?: string
          accessed_at?: string
          created_at?: string
          data_returned?: Json | null
          doctor_name?: string | null
          id?: string
          order_id?: string | null
          patient_id?: string | null
          portal_type?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_ip?: string | null
          access_method?: string
          accessed_at?: string
          created_at?: string
          data_returned?: Json | null
          doctor_name?: string | null
          id?: string
          order_id?: string | null
          patient_id?: string | null
          portal_type?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_access_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_access_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_access_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          crm: string | null
          full_name: string
          id: string
          role_display: string
          sector: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crm?: string | null
          full_name?: string
          id?: string
          role_display?: string
          sector?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crm?: string | null
          full_name?: string
          id?: string
          role_display?: string
          sector?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qc_data: {
        Row: {
          analyte: string
          equipment: string
          id: string
          level: string
          mean: number
          recorded_at: string
          recorded_by: string | null
          sd: number
          status: string
          tenant_id: string | null
          value: number
        }
        Insert: {
          analyte: string
          equipment?: string
          id?: string
          level: string
          mean: number
          recorded_at?: string
          recorded_by?: string | null
          sd: number
          status?: string
          tenant_id?: string | null
          value: number
        }
        Update: {
          analyte?: string
          equipment?: string
          id?: string
          level?: string
          mean?: number
          recorded_at?: string
          recorded_by?: string | null
          sd?: number
          status?: string
          tenant_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "qc_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          amount: number
          billing_batch_id: string | null
          created_at: string
          created_by: string | null
          description: string
          discount: number
          due_date: string
          id: string
          net_amount: number
          notes: string | null
          order_id: string | null
          paid_amount: number | null
          paid_at: string | null
          patient_id: string
          payment_method: string | null
          payment_type: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_batch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount?: number
          due_date?: string
          id?: string
          net_amount?: number
          notes?: string | null
          order_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          patient_id: string
          payment_method?: string | null
          payment_type?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_batch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount?: number
          due_date?: string
          id?: string
          net_amount?: number
          notes?: string | null
          order_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          patient_id?: string
          payment_method?: string | null
          payment_type?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_billing_batch_id_fkey"
            columns: ["billing_batch_id"]
            isOneToOne: false
            referencedRelation: "billing_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      report_layouts: {
        Row: {
          created_at: string
          default_observations: string | null
          exam_id: string
          footer_text: string | null
          header_text: string | null
          hide_flag: boolean
          hide_reference_range: boolean
          hide_unit: boolean
          id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_observations?: string | null
          exam_id: string
          footer_text?: string | null
          header_text?: string | null
          hide_flag?: boolean
          hide_reference_range?: boolean
          hide_unit?: boolean
          id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_observations?: string | null
          exam_id?: string
          footer_text?: string | null
          header_text?: string | null
          hide_flag?: boolean
          hide_reference_range?: boolean
          hide_unit?: boolean
          id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_layouts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_layouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          analyst_id: string | null
          created_at: string
          exam: string
          flag: string
          id: string
          order_id: string
          reference_range: string
          released_at: string | null
          sample_id: string | null
          status: string
          tenant_id: string | null
          unit: string
          validated_at: string | null
          value: string
        }
        Insert: {
          analyst_id?: string | null
          created_at?: string
          exam: string
          flag?: string
          id?: string
          order_id: string
          reference_range?: string
          released_at?: string | null
          sample_id?: string | null
          status?: string
          tenant_id?: string | null
          unit?: string
          validated_at?: string | null
          value: string
        }
        Update: {
          analyst_id?: string | null
          created_at?: string
          exam?: string
          flag?: string
          id?: string
          order_id?: string
          reference_range?: string
          released_at?: string | null
          sample_id?: string | null
          status?: string
          tenant_id?: string | null
          unit?: string
          validated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          route: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          route: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          route?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_nonconformities: {
        Row: {
          corrective_action: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_by: string | null
          reported_by_name: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          sample_id: string
          severity: Database["public"]["Enums"]["nonconformity_severity"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_by?: string | null
          reported_by_name?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          sample_id: string
          severity?: Database["public"]["Enums"]["nonconformity_severity"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_by?: string | null
          reported_by_name?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          sample_id?: string
          severity?: Database["public"]["Enums"]["nonconformity_severity"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_nonconformities_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_nonconformities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_temperature_logs: {
        Row: {
          id: string
          is_within_range: boolean
          location: string | null
          max_acceptable: number
          min_acceptable: number
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          recorded_by_name: string
          sample_id: string
          temperature_celsius: number
          tenant_id: string | null
          transport_condition: string | null
        }
        Insert: {
          id?: string
          is_within_range?: boolean
          location?: string | null
          max_acceptable?: number
          min_acceptable?: number
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          recorded_by_name?: string
          sample_id: string
          temperature_celsius: number
          tenant_id?: string | null
          transport_condition?: string | null
        }
        Update: {
          id?: string
          is_within_range?: boolean
          location?: string | null
          max_acceptable?: number
          min_acceptable?: number
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          recorded_by_name?: string
          sample_id?: string
          temperature_celsius?: number
          tenant_id?: string | null
          transport_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_temperature_logs_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_temperature_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_tracking_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          location: string | null
          new_status: string | null
          notes: string | null
          performed_by: string | null
          performed_by_name: string
          previous_status: string | null
          sample_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string
          previous_status?: string | null
          sample_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          performed_by_name?: string
          previous_status?: string | null
          sample_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_tracking_events_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_tracking_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          barcode: string
          collected_at: string
          condition: string
          created_at: string
          disposal_at: string | null
          disposal_by: string | null
          id: string
          is_rejected: boolean
          order_id: string
          rejection_reason: string | null
          sample_type: string
          sector: string
          stability_hours: number | null
          status: string
          storage_location: string | null
          tenant_id: string | null
          transport_condition: string | null
        }
        Insert: {
          barcode: string
          collected_at?: string
          condition?: string
          created_at?: string
          disposal_at?: string | null
          disposal_by?: string | null
          id?: string
          is_rejected?: boolean
          order_id: string
          rejection_reason?: string | null
          sample_type: string
          sector: string
          stability_hours?: number | null
          status?: string
          storage_location?: string | null
          tenant_id?: string | null
          transport_condition?: string | null
        }
        Update: {
          barcode?: string
          collected_at?: string
          condition?: string
          created_at?: string
          disposal_at?: string | null
          disposal_by?: string | null
          id?: string
          is_rejected?: boolean
          order_id?: string
          rejection_reason?: string | null
          sample_type?: string
          sector?: string
          stability_hours?: number | null
          status?: string
          storage_location?: string | null
          tenant_id?: string | null
          transport_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "samples_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string
          primary_color: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string
          primary_color?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string
          primary_color?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tecnico" | "recepcao"
      nonconformity_severity: "baixa" | "media" | "alta" | "critica"
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
      app_role: ["admin", "tecnico", "recepcao"],
      nonconformity_severity: ["baixa", "media", "alta", "critica"],
    },
  },
} as const
