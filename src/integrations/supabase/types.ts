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
          updated_at?: string
        }
        Relationships: []
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
          turnaround_hours?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
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
          updated_at?: string
        }
        Relationships: []
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
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
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
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lab_settings: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string
          crm_responsible: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          technical_responsible: string
          updated_at: string
          updated_by: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string
          crm_responsible?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          technical_responsible?: string
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string
          crm_responsible?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          technical_responsible?: string
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Relationships: []
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
        ]
      }
      patients: {
        Row: {
          birth_date: string
          cpf: string
          created_at: string
          created_by: string | null
          email: string | null
          gender: string
          id: string
          insurance: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          cpf: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          gender: string
          id?: string
          insurance?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          cpf?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          gender?: string
          id?: string
          insurance?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      permission_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string
          route: string
          target_role: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by: string
          route: string
          target_role: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string
          route?: string
          target_role?: string
        }
        Relationships: []
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
          value?: number
        }
        Relationships: []
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
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          route: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          route: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          route?: string
          updated_at?: string
        }
        Relationships: []
      }
      samples: {
        Row: {
          barcode: string
          collected_at: string
          created_at: string
          id: string
          order_id: string
          sample_type: string
          sector: string
          status: string
        }
        Insert: {
          barcode: string
          collected_at?: string
          created_at?: string
          id?: string
          order_id: string
          sample_type: string
          sector: string
          status?: string
        }
        Update: {
          barcode?: string
          collected_at?: string
          created_at?: string
          id?: string
          order_id?: string
          sample_type?: string
          sector?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
    },
  },
} as const
