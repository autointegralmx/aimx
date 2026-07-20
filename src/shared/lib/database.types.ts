export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_unit: Database["public"]["Enums"]["business_unit"]
          created_at: string
          email: string | null
          id: string
          idempotency_key: string
          message: string | null
          name: string
          phone: string
          public_reference: string
          source_page: string
          status: Database["public"]["Enums"]["lead_status"]
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicle_id: string | null
        }
        Insert: {
          business_unit?: Database["public"]["Enums"]["business_unit"]
          created_at?: string
          email?: string | null
          id?: string
          idempotency_key: string
          message?: string | null
          name: string
          phone: string
          public_reference: string
          source_page: string
          status?: Database["public"]["Enums"]["lead_status"]
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_id?: string | null
        }
        Update: {
          business_unit?: Database["public"]["Enums"]["business_unit"]
          created_at?: string
          email?: string | null
          id?: string
          idempotency_key?: string
          message?: string | null
          name?: string
          phone?: string
          public_reference?: string
          source_page?: string
          status?: Database["public"]["Enums"]["lead_status"]
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          byte_size: number
          checksum: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          height: number | null
          id: string
          mime_type: string
          object_path: string
          original_filename: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          byte_size: number
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          height?: number | null
          id?: string
          mime_type: string
          object_path: string
          original_filename: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          byte_size?: number
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          height?: number | null
          id?: string
          mime_type?: string
          object_path?: string
          original_filename?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          canonical_domain: string
          default_currency: string
          default_whatsapp_number: string
          general_phone: string | null
          id: number
          inventory_whatsapp_number: string | null
          primary_location: string
          public_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          canonical_domain?: string
          default_currency?: string
          default_whatsapp_number?: string
          general_phone?: string | null
          id?: number
          inventory_whatsapp_number?: string | null
          primary_location?: string
          public_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          canonical_domain?: string
          default_currency?: string
          default_whatsapp_number?: string
          general_phone?: string | null
          id?: number
          inventory_whatsapp_number?: string | null
          primary_location?: string
          public_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_media: {
        Row: {
          created_at: string
          is_cover: boolean
          media_asset_id: string
          position: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          is_cover?: boolean
          media_asset_id: string
          position?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          is_cover?: boolean
          media_asset_id?: string
          position?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_media_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_media_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_type: string | null
          category: Database["public"]["Enums"]["vehicle_category"]
          condition_notes: string | null
          created_at: string
          created_by: string | null
          currency: string
          damage_summary: string | null
          damage_tags: string[]
          deleted_at: string | null
          exterior_color: string | null
          featured_order: number | null
          fuel_type: string | null
          full_description: string | null
          id: string
          internal_price: number | null
          is_featured: boolean
          is_published: boolean
          is_weekly_opportunity: boolean
          location_label: string | null
          make: string
          mileage_km: number | null
          model: string
          opportunity_deadline: string | null
          price_amount: number | null
          price_label: string | null
          private_notes: string | null
          provider_reference: string | null
          public_description: string | null
          public_tags: string[]
          public_title: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["vehicle_status"]
          stock_code: string | null
          transmission: string | null
          updated_at: string
          updated_by: string | null
          version: string | null
          vin: string | null
          year: number
        }
        Insert: {
          body_type?: string | null
          category: Database["public"]["Enums"]["vehicle_category"]
          condition_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          damage_summary?: string | null
          damage_tags?: string[]
          deleted_at?: string | null
          exterior_color?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          full_description?: string | null
          id?: string
          internal_price?: number | null
          is_featured?: boolean
          is_published?: boolean
          is_weekly_opportunity?: boolean
          location_label?: string | null
          make: string
          mileage_km?: number | null
          model: string
          opportunity_deadline?: string | null
          price_amount?: number | null
          price_label?: string | null
          private_notes?: string | null
          provider_reference?: string | null
          public_description?: string | null
          public_tags?: string[]
          public_title?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          stock_code?: string | null
          transmission?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          body_type?: string | null
          category?: Database["public"]["Enums"]["vehicle_category"]
          condition_notes?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          damage_summary?: string | null
          damage_tags?: string[]
          deleted_at?: string | null
          exterior_color?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          full_description?: string | null
          id?: string
          internal_price?: number | null
          is_featured?: boolean
          is_published?: boolean
          is_weekly_opportunity?: boolean
          location_label?: string | null
          make?: string
          mileage_km?: number | null
          model?: string
          opportunity_deadline?: string | null
          price_amount?: number | null
          price_label?: string | null
          private_notes?: string | null
          provider_reference?: string | null
          public_description?: string | null
          public_tags?: string[]
          public_title?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          stock_code?: string | null
          transmission?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vehicles_public: {
        Row: {
          body_type: string | null
          category: Database["public"]["Enums"]["vehicle_category"] | null
          condition_notes: string | null
          created_at: string | null
          currency: string | null
          damage_summary: string | null
          damage_tags: string[] | null
          exterior_color: string | null
          featured_order: number | null
          fuel_type: string | null
          full_description: string | null
          id: string | null
          is_featured: boolean | null
          is_weekly_opportunity: boolean | null
          location_label: string | null
          make: string | null
          mileage_km: number | null
          model: string | null
          opportunity_deadline: string | null
          price_amount: number | null
          price_label: string | null
          public_tags: string[] | null
          public_title: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          transmission: string | null
          version: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          category?: Database["public"]["Enums"]["vehicle_category"] | null
          condition_notes?: string | null
          created_at?: string | null
          currency?: string | null
          damage_summary?: string | null
          damage_tags?: string[] | null
          exterior_color?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          full_description?: never
          id?: string | null
          is_featured?: boolean | null
          is_weekly_opportunity?: boolean | null
          location_label?: string | null
          make?: string | null
          mileage_km?: number | null
          model?: string | null
          opportunity_deadline?: string | null
          price_amount?: number | null
          price_label?: string | null
          public_tags?: string[] | null
          public_title?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          transmission?: string | null
          version?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          category?: Database["public"]["Enums"]["vehicle_category"] | null
          condition_notes?: string | null
          created_at?: string | null
          currency?: string | null
          damage_summary?: string | null
          damage_tags?: string[] | null
          exterior_color?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          full_description?: never
          id?: string | null
          is_featured?: boolean | null
          is_weekly_opportunity?: boolean | null
          location_label?: string | null
          make?: string | null
          mileage_km?: number | null
          model?: string | null
          opportunity_deadline?: string | null
          price_amount?: number | null
          price_label?: string | null
          public_tags?: string[] | null
          public_title?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          transmission?: string | null
          version?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_public_vehicle_lead: {
        Args: {
          p_email?: string
          p_idempotency_key?: string
          p_message?: string
          p_name: string
          p_phone: string
          p_source_page: string
          p_user_agent?: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
          p_vehicle_id: string
        }
        Returns: {
          created: boolean
          public_reference: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_role: "admin" | "editor"
      business_unit:
        | "inventory"
        | "opportunities"
        | "workshop"
        | "keys"
        | "general"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "lost"
        | "spam"
        | "archived"
      vehicle_category: "accidentado" | "recuperado" | "seminuevo"
      vehicle_status: "draft" | "available" | "reserved" | "sold" | "archived"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["admin", "editor"],
      business_unit: [
        "inventory",
        "opportunities",
        "workshop",
        "keys",
        "general",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost",
        "spam",
        "archived",
      ],
      vehicle_category: ["accidentado", "recuperado", "seminuevo"],
      vehicle_status: ["draft", "available", "reserved", "sold", "archived"],
    },
  },
} as const

