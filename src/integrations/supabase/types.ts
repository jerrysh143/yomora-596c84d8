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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          customer_email: string
          discount_amount: number
          id: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          customer_email: string
          discount_amount: number
          id?: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          customer_email?: string
          discount_amount?: number
          id?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          maximum_discount: number | null
          member_only: boolean
          minimum_order: number
          per_customer_limit: number
          starts_at: string | null
          times_used: number
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          maximum_discount?: number | null
          member_only?: boolean
          minimum_order?: number
          per_customer_limit?: number
          starts_at?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          maximum_discount?: number | null
          member_only?: boolean
          minimum_order?: number
          per_customer_limit?: number
          starts_at?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          activated_at: string | null
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          id: string
          member_number: string | null
          notes: string | null
          plan_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          member_number?: string | null
          notes?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          member_number?: string | null
          notes?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipments: {
        Row: {
          address_line: string
          awb_code: string | null
          carrier_id: string | null
          carrier_name: string | null
          city: string
          created_at: string
          delivered_at: string | null
          estimated_delivery_date: string | null
          id: string
          label_url: string | null
          last_error: string | null
          last_synced_at: string | null
          order_id: string
          payment_method: string
          pincode: string
          shipment_id: string | null
          state: string
          status: string
          sub_status: string | null
          tracking_activities: Json
          tracking_url: string | null
          updated_at: string
          velocity_order_id: string | null
        }
        Insert: {
          address_line?: string
          awb_code?: string | null
          carrier_id?: string | null
          carrier_name?: string | null
          city?: string
          created_at?: string
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          label_url?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          order_id: string
          payment_method?: string
          pincode?: string
          shipment_id?: string | null
          state?: string
          status?: string
          sub_status?: string | null
          tracking_activities?: Json
          tracking_url?: string | null
          updated_at?: string
          velocity_order_id?: string | null
        }
        Update: {
          address_line?: string
          awb_code?: string | null
          carrier_id?: string | null
          carrier_name?: string | null
          city?: string
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          label_url?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          payment_method?: string
          pincode?: string
          shipment_id?: string | null
          state?: string
          status?: string
          sub_status?: string | null
          tracking_activities?: Json
          tracking_url?: string | null
          updated_at?: string
          velocity_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string
          error_code: string | null
          id: string
          merchant_order_id: string
          order_id: string
          paid_at: string | null
          payment_mode: string | null
          provider: string
          provider_order_id: string | null
          provider_response: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_code?: string | null
          id?: string
          merchant_order_id: string
          order_id: string
          paid_at?: string | null
          payment_mode?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          error_code?: string | null
          paid_at?: string | null
          payment_mode?: string | null
          provider_order_id?: string | null
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount: number
          id: string
          items: Json
          notes: string
          shipping_address: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string
          shipping_address?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string
          shipping_address?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      customer_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string | null
          name: string | null
          phone: string | null
          request_fingerprint: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inquiry_type: string
          message?: string | null
          name?: string | null
          phone?: string | null
          request_fingerprint?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          request_fingerprint?: string | null
          status?: string
        }
        Relationships: []
      }
      product_notify_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          notified: boolean
          phone: string | null
          product_id: string
          request_fingerprint: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notified?: boolean
          phone?: string | null
          product_id: string
          request_fingerprint?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notified?: boolean
          phone?: string | null
          product_id?: string
          request_fingerprint?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          id: string
          is_published: boolean
          media_urls: string[]
          order_id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
          verified_purchase: boolean
        }
        Insert: {
          comment: string
          created_at?: string
          customer_name: string
          id?: string
          is_published?: boolean
          media_urls?: string[]
          order_id: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
          verified_purchase?: boolean
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_published?: boolean
          media_urls?: string[]
          order_id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience: string
          category: string
          created_at: string
          description: string
          gallery_urls: string[]
          id: string
          image_url: string | null
          is_new: boolean
          name: string
          price: number
          sold_out: boolean
          tagline: string
          updated_at: string
        }
        Insert: {
          audience?: string
          category: string
          created_at?: string
          description?: string
          gallery_urls?: string[]
          id: string
          image_url?: string | null
          is_new?: boolean
          name: string
          price: number
          sold_out?: boolean
          tagline?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          category?: string
          created_at?: string
          description?: string
          gallery_urls?: string[]
          id?: string
          image_url?: string | null
          is_new?: boolean
          name?: string
          price?: number
          sold_out?: boolean
          tagline?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      site_content: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plan: {
        Row: {
          benefits: Json
          created_at: string
          cta_label: string
          duration_label: string
          id: string
          is_active: boolean
          name: string
          price: number
          tagline: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          created_at?: string
          cta_label?: string
          duration_label?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          created_at?: string
          cta_label?: string
          duration_label?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      velocity_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          payload: Json
          received_at: string
          shipment_id: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          payload: Json
          received_at?: string
          shipment_id?: string | null
        }
        Update: {
          event_type?: string
          payload?: Json
          received_at?: string
          shipment_id?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image: string
          name: string
          price: number
          product_id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image: string
          name: string
          price: number
          product_id: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image?: string
          name?: string
          price?: number
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_product_notify_request: {
        Args: {
          _email: string
          _name: string
          _phone: string
          _product_id: string
          _request_fingerprint: string
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
      redeem_coupon_for_order: {
        Args: {
          _coupon_code: string
          _order_id: string
          _user_id?: string | null
        }
        Returns: {
          coupon_code: string
          discount_amount: number
          total: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status: "pending" | "completed" | "cancelled"
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
      app_role: ["admin", "user"],
      order_status: ["pending", "completed", "cancelled"],
    },
  },
} as const
