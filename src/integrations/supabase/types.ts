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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      patient_feedback_records: {
        Row: {
          ate_less_than_planned: boolean | null
          avg_cardio_per_week: number | null
          avg_sleep_hours: number | null
          avg_water_intake_liters: number | null
          avg_workouts_per_week: number | null
          body_measurement_notes: string | null
          cardio_duration_minutes: number | null
          cardio_score: number | null
          cheat_meal_content: string | null
          cheat_meal_score: number | null
          created_at: string | null
          current_main_goal: string | null
          diet_adjustment_notes: string | null
          difficulties_faced: string | null
          felt_hungry_at_any_time: boolean | null
          food_to_include: string | null
          had_cheat_meal: boolean | null
          had_snack: boolean | null
          id: string
          libido_level: number | null
          libido_score: number | null
          noticed_visual_improvement: boolean | null
          overall_score: number | null
          patient_id: string | null
          phone_number: string | null
          photo_urls: string[] | null
          progress_evolution_notes: string | null
          rest_between_sets_minutes: number | null
          rest_between_sets_score: number | null
          sleep_quality_score: number | null
          sleep_score: number | null
          snack_content: string | null
          snack_score: number | null
          stress_level: number | null
          stress_score: number | null
          updated_at: string | null
          visual_improvement_points: string | null
          water_intake_score: number | null
          weight: number | null
          workout_duration_minutes: number | null
          workout_score: number | null
        }
        Insert: {
          ate_less_than_planned?: boolean | null
          avg_cardio_per_week?: number | null
          avg_sleep_hours?: number | null
          avg_water_intake_liters?: number | null
          avg_workouts_per_week?: number | null
          body_measurement_notes?: string | null
          cardio_duration_minutes?: number | null
          cardio_score?: number | null
          cheat_meal_content?: string | null
          cheat_meal_score?: number | null
          created_at?: string | null
          current_main_goal?: string | null
          diet_adjustment_notes?: string | null
          difficulties_faced?: string | null
          felt_hungry_at_any_time?: boolean | null
          food_to_include?: string | null
          had_cheat_meal?: boolean | null
          had_snack?: boolean | null
          id?: string
          libido_level?: number | null
          libido_score?: number | null
          noticed_visual_improvement?: boolean | null
          overall_score?: number | null
          patient_id?: string | null
          phone_number?: string | null
          photo_urls?: string[] | null
          progress_evolution_notes?: string | null
          rest_between_sets_minutes?: number | null
          rest_between_sets_score?: number | null
          sleep_quality_score?: number | null
          sleep_score?: number | null
          snack_content?: string | null
          snack_score?: number | null
          stress_level?: number | null
          stress_score?: number | null
          updated_at?: string | null
          visual_improvement_points?: string | null
          water_intake_score?: number | null
          weight?: number | null
          workout_duration_minutes?: number | null
          workout_score?: number | null
        }
        Update: {
          ate_less_than_planned?: boolean | null
          avg_cardio_per_week?: number | null
          avg_sleep_hours?: number | null
          avg_water_intake_liters?: number | null
          avg_workouts_per_week?: number | null
          body_measurement_notes?: string | null
          cardio_duration_minutes?: number | null
          cardio_score?: number | null
          cheat_meal_content?: string | null
          cheat_meal_score?: number | null
          created_at?: string | null
          current_main_goal?: string | null
          diet_adjustment_notes?: string | null
          difficulties_faced?: string | null
          felt_hungry_at_any_time?: boolean | null
          food_to_include?: string | null
          had_cheat_meal?: boolean | null
          had_snack?: boolean | null
          id?: string
          libido_level?: number | null
          libido_score?: number | null
          noticed_visual_improvement?: boolean | null
          overall_score?: number | null
          patient_id?: string | null
          phone_number?: string | null
          photo_urls?: string[] | null
          progress_evolution_notes?: string | null
          rest_between_sets_minutes?: number | null
          rest_between_sets_score?: number | null
          sleep_quality_score?: number | null
          sleep_score?: number | null
          snack_content?: string | null
          snack_score?: number | null
          stress_level?: number | null
          stress_score?: number | null
          updated_at?: string | null
          visual_improvement_points?: string | null
          water_intake_score?: number | null
          weight?: number | null
          workout_duration_minutes?: number | null
          workout_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_feedback_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_feedback_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string | null
          days_to_expiration: number | null
          expiration_date: string | null
          follow_up_duration_months: number | null
          full_name: string | null
          id: string
          phone_number: string | null
          plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_to_expiration?: number | null
          expiration_date?: string | null
          follow_up_duration_months?: number | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_to_expiration?: number | null
          expiration_date?: string | null
          follow_up_duration_months?: number | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patients_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          period: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          period: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          period?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
