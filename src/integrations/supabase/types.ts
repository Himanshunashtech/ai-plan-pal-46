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
      daily_nutrition_logs: {
        Row: {
          calories_burned: number | null
          created_at: string
          id: string
          log_date: string
          notes: string | null
          steps: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fats: number | null
          total_fiber: number | null
          total_protein: number | null
          total_sodium: number | null
          total_sugar: number | null
          updated_at: string
          user_id: string
          water_intake: number | null
          weight: number | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          steps?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_sodium?: number | null
          total_sugar?: number | null
          updated_at?: string
          user_id: string
          water_intake?: number | null
          weight?: number | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          steps?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fats?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_sodium?: number | null
          total_sugar?: number | null
          updated_at?: string
          user_id?: string
          water_intake?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          barcode: string | null
          calories: number
          carbs: number | null
          created_at: string
          fats: number | null
          fiber: number | null
          id: string
          image_url: string | null
          logged_at: string
          meal_type: string | null
          name: string
          protein: number | null
          serving_size: string | null
          sodium: number | null
          sugar: number | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          calories?: number
          carbs?: number | null
          created_at?: string
          fats?: number | null
          fiber?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string | null
          name: string
          protein?: number | null
          serving_size?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          calories?: number
          carbs?: number | null
          created_at?: string
          fats?: number | null
          fiber?: number | null
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string | null
          name?: string
          protein?: number | null
          serving_size?: string | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          avatar_url: string | null
          cooking_time: string | null
          created_at: string
          current_weight: number | null
          daily_calories: number | null
          daily_carbs: number | null
          daily_fats: number | null
          daily_fiber: number | null
          daily_protein: number | null
          daily_sodium: number | null
          daily_sugar: number | null
          diet_type: string | null
          exercise_frequency: number | null
          exercise_type: string[] | null
          full_name: string | null
          gender: string | null
          goal: string | null
          health_conditions: string[] | null
          height: number | null
          height_unit: string | null
          id: string
          meals_per_day: number | null
          medications: boolean | null
          motivation: string[] | null
          onboarding_completed: boolean | null
          previous_diets: boolean | null
          sleep_hours: number | null
          snacking: string | null
          stress_level: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          target_date: string | null
          target_weight: number | null
          updated_at: string
          user_id: string
          water_intake: number | null
          weekly_goal: number | null
          weight_unit: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          cooking_time?: string | null
          created_at?: string
          current_weight?: number | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fats?: number | null
          daily_fiber?: number | null
          daily_protein?: number | null
          daily_sodium?: number | null
          daily_sugar?: number | null
          diet_type?: string | null
          exercise_frequency?: number | null
          exercise_type?: string[] | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          health_conditions?: string[] | null
          height?: number | null
          height_unit?: string | null
          id?: string
          meals_per_day?: number | null
          medications?: boolean | null
          motivation?: string[] | null
          onboarding_completed?: boolean | null
          previous_diets?: boolean | null
          sleep_hours?: number | null
          snacking?: string | null
          stress_level?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          target_date?: string | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
          water_intake?: number | null
          weekly_goal?: number | null
          weight_unit?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          cooking_time?: string | null
          created_at?: string
          current_weight?: number | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fats?: number | null
          daily_fiber?: number | null
          daily_protein?: number | null
          daily_sodium?: number | null
          daily_sugar?: number | null
          diet_type?: string | null
          exercise_frequency?: number | null
          exercise_type?: string[] | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          health_conditions?: string[] | null
          height?: number | null
          height_unit?: string | null
          id?: string
          meals_per_day?: number | null
          medications?: boolean | null
          motivation?: string[] | null
          onboarding_completed?: boolean | null
          previous_diets?: boolean | null
          sleep_hours?: number | null
          snacking?: string | null
          stress_level?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          target_date?: string | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          water_intake?: number | null
          weekly_goal?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
