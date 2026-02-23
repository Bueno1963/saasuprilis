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
