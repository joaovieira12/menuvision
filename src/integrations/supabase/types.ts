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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      billing_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          kind: string
          paid_at: string | null
          provider_payment_id: string | null
          status: string
          subscription_id: string
          verified_event_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          kind: string
          paid_at?: string | null
          provider_payment_id?: string | null
          status?: string
          subscription_id: string
          verified_event_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          paid_at?: string | null
          provider_payment_id?: string | null
          status?: string
          subscription_id?: string
          verified_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "restaurant_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_verified_event_id_fkey"
            columns: ["verified_event_id"]
            isOneToOne: false
            referencedRelation: "billing_webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          id: string
          processed_at: string | null
          provider: string
          provider_event_id: string
          provider_resource_id: string
          received_at: string
          resource_verified: boolean
          signature_verified: boolean
        }
        Insert: {
          id?: string
          processed_at?: string | null
          provider?: string
          provider_event_id: string
          provider_resource_id: string
          received_at?: string
          resource_verified?: boolean
          signature_verified?: boolean
        }
        Update: {
          id?: string
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          provider_resource_id?: string
          received_at?: string
          resource_verified?: boolean
          signature_verified?: boolean
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_model_jobs: {
        Row: {
          created_at: string
          dish_id: string
          error_message: string | null
          id: string
          model_path: string | null
          owner_id: string
          progress: number
          provider_task_id: string | null
          restaurant_id: string
          status: string
          width_cm: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          error_message?: string | null
          id?: string
          model_path?: string | null
          owner_id: string
          progress?: number
          provider_task_id?: string | null
          restaurant_id: string
          status?: string
          width_cm: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          error_message?: string | null
          id?: string
          model_path?: string | null
          owner_id?: string
          progress?: number
          provider_task_id?: string | null
          restaurant_id?: string
          status?: string
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "dish_model_jobs_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_model_jobs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string
          photo_path: string | null
          price: number
          restaurant_id: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_id: string
          photo_path?: string | null
          price: number
          restaurant_id: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string
          photo_path?: string | null
          price?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_id_restaurant_id_fkey"
            columns: ["category_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_orders: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          items: Json
          notes: string
          number: number
          owner_id: string
          restaurant_id: string
          status: string
          table_label: string
          total_cents: number
          tracking_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          items: Json
          notes?: string
          number?: never
          owner_id: string
          restaurant_id: string
          status?: string
          table_label?: string
          total_cents: number
          tracking_token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          items?: Json
          notes?: string
          number?: never
          owner_id?: string
          restaurant_id?: string
          status?: string
          table_label?: string
          total_cents?: number
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_promotions: {
        Row: {
          active: boolean
          applies_to: string
          code: string
          discount_percent: number
          ends_at: string
          id: string
          plan_id: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          applies_to: string
          code: string
          discount_percent: number
          ends_at: string
          id?: string
          plan_id: string
          starts_at: string
        }
        Update: {
          active?: boolean
          applies_to?: string
          code?: string
          discount_percent?: number
          ends_at?: string
          id?: string
          plan_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_promotions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          audience: string
          billing_interval_days: number
          currency: string
          dish_limit: number | null
          featured: boolean
          features: Json
          id: string
          installation_price_cents: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
          weekly_generation_limit: number
          weekly_price_cents: number
        }
        Insert: {
          active?: boolean
          audience: string
          billing_interval_days?: number
          currency?: string
          dish_limit?: number | null
          featured?: boolean
          features?: Json
          id?: string
          installation_price_cents: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          weekly_generation_limit?: number
          weekly_price_cents: number
        }
        Update: {
          active?: boolean
          audience?: string
          billing_interval_days?: number
          currency?: string
          dish_limit?: number | null
          featured?: boolean
          features?: Json
          id?: string
          installation_price_cents?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          weekly_generation_limit?: number
          weekly_price_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          preferences: Json
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          preferences?: Json
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          preferences?: Json
        }
        Relationships: []
      }
      restaurant_subscriptions: {
        Row: {
          billing_interval_days: number
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          dish_limit_override: number | null
          id: string
          installation_checkout_url: string | null
          installation_price_cents: number
          owner_id: string
          plan_id: string
          provider: string
          provider_status: string
          provider_subscription_id: string | null
          renews_automatically: boolean
          restaurant_id: string
          status: string
          subscription_checkout_url: string | null
          verified_event_id: string | null
          weekly_price_cents: number
        }
        Insert: {
          billing_interval_days?: number
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          dish_limit_override?: number | null
          id?: string
          installation_checkout_url?: string | null
          installation_price_cents: number
          owner_id: string
          plan_id: string
          provider?: string
          provider_status?: string
          provider_subscription_id?: string | null
          renews_automatically?: boolean
          restaurant_id: string
          status?: string
          subscription_checkout_url?: string | null
          verified_event_id?: string | null
          weekly_price_cents: number
        }
        Update: {
          billing_interval_days?: number
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          dish_limit_override?: number | null
          id?: string
          installation_checkout_url?: string | null
          installation_price_cents?: number
          owner_id?: string
          plan_id?: string
          provider?: string
          provider_status?: string
          provider_subscription_id?: string | null
          renews_automatically?: boolean
          restaurant_id?: string
          status?: string
          subscription_checkout_url?: string | null
          verified_event_id?: string | null
          weekly_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_subscriptions_verified_event_id_fkey"
            columns: ["verified_event_id"]
            isOneToOne: false
            referencedRelation: "billing_webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          description: string
          id: string
          logo_url: string | null
          menu_published: boolean
          name: string
          owner_id: string
          phone: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          menu_published?: boolean
          name: string
          owner_id: string
          phone?: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          menu_published?: boolean
          name?: string
          owner_id?: string
          phone?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_mercado_pago_confirmation: {
        Args: {
          p_amount_cents?: number
          p_event_key: string
          p_kind?: string
          p_paid_at?: string
          p_payment_id?: string
          p_payment_status?: string
          p_provider_status: string
          p_resource_id: string
          p_subscription_id: string
        }
        Returns: undefined
      }
      place_menu_order: {
        Args: {
          p_items: Json
          p_name: string
          p_notes: string
          p_slug: string
          p_table: string
          p_token: string
        }
        Returns: Json
      }
      read_published_menu: { Args: { p_slug: string }; Returns: Json }
      track_menu_order: { Args: { p_token: string }; Returns: Json }
      update_menu_order_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
