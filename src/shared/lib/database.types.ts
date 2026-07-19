export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Hand-written stub aligned with:
 * - supabase/migrations/20260719190000_initial_vertical_cut.sql
 * - supabase/migrations/20260719220000_vehicles_v1_extensions.sql
 * Replace via `pnpm db:types` once `supabase start` succeeds (requires Docker).
 */
export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "editor";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "editor";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_profiles"]["Insert"]>;
      };
      vehicles: {
        Row: {
          id: string;
          slug: string;
          stock_code: string | null;
          category: "accidentado" | "recuperado" | "seminuevo";
          make: string;
          model: string;
          version: string | null;
          year: number;
          body_type: string | null;
          mileage_km: number | null;
          transmission: string | null;
          fuel_type: string | null;
          exterior_color: string | null;
          public_title: string | null;
          short_description: string | null;
          full_description: string | null;
          public_description: string | null;
          price_amount: number | null;
          price_label: string | null;
          currency: string;
          status: "draft" | "available" | "reserved" | "sold" | "archived";
          is_published: boolean;
          is_featured: boolean;
          is_weekly_opportunity: boolean;
          opportunity_deadline: string | null;
          featured_order: number | null;
          damage_summary: string | null;
          condition_notes: string | null;
          damage_tags: string[];
          public_tags: string[];
          private_notes: string | null;
          location_label: string | null;
          vin: string | null;
          provider_reference: string | null;
          internal_price: number | null;
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          stock_code?: string | null;
          category: "accidentado" | "recuperado" | "seminuevo";
          make: string;
          model: string;
          version?: string | null;
          year: number;
          body_type?: string | null;
          mileage_km?: number | null;
          transmission?: string | null;
          fuel_type?: string | null;
          exterior_color?: string | null;
          public_title?: string | null;
          short_description?: string | null;
          full_description?: string | null;
          public_description?: string | null;
          price_amount?: number | null;
          price_label?: string | null;
          currency?: string;
          status?: "draft" | "available" | "reserved" | "sold" | "archived";
          is_published?: boolean;
          is_featured?: boolean;
          is_weekly_opportunity?: boolean;
          opportunity_deadline?: string | null;
          featured_order?: number | null;
          damage_summary?: string | null;
          condition_notes?: string | null;
          damage_tags?: string[];
          public_tags?: string[];
          private_notes?: string | null;
          location_label?: string | null;
          vin?: string | null;
          provider_reference?: string | null;
          internal_price?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
      };
      media_assets: {
        Row: {
          id: string;
          bucket: string;
          object_path: string;
          original_filename: string;
          mime_type: string;
          byte_size: number;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          checksum: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          bucket: string;
          object_path: string;
          original_filename: string;
          mime_type: string;
          byte_size: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          checksum?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
      };
      vehicle_media: {
        Row: {
          vehicle_id: string;
          media_asset_id: string;
          position: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: {
          vehicle_id: string;
          media_asset_id: string;
          position?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicle_media"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: number;
          public_name: string;
          canonical_domain: string;
          general_phone: string | null;
          default_whatsapp_number: string;
          inventory_whatsapp_number: string | null;
          primary_location: string;
          default_currency: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          public_name?: string;
          canonical_domain?: string;
          general_phone?: string | null;
          default_whatsapp_number?: string;
          inventory_whatsapp_number?: string | null;
          primary_location?: string;
          default_currency?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          public_reference: string;
          business_unit:
            | "inventory"
            | "opportunities"
            | "workshop"
            | "keys"
            | "general";
          vehicle_id: string | null;
          source_page: string;
          name: string;
          phone: string;
          email: string | null;
          message: string | null;
          status:
            | "new"
            | "contacted"
            | "qualified"
            | "converted"
            | "lost"
            | "spam"
            | "archived";
          idempotency_key: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          public_reference: string;
          business_unit?:
            | "inventory"
            | "opportunities"
            | "workshop"
            | "keys"
            | "general";
          vehicle_id?: string | null;
          source_page: string;
          name: string;
          phone: string;
          email?: string | null;
          message?: string | null;
          status?:
            | "new"
            | "contacted"
            | "qualified"
            | "converted"
            | "lost"
            | "spam"
            | "archived";
          idempotency_key: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_events"]["Insert"]>;
      };
    };
    Views: {
      vehicles_public: {
        Row: {
          id: string;
          slug: string;
          category: "accidentado" | "recuperado" | "seminuevo";
          make: string;
          model: string;
          version: string | null;
          year: number;
          body_type: string | null;
          mileage_km: number | null;
          transmission: string | null;
          fuel_type: string | null;
          exterior_color: string | null;
          public_title: string | null;
          short_description: string | null;
          full_description: string | null;
          price_amount: number | null;
          price_label: string | null;
          currency: string;
          status: "draft" | "available" | "reserved" | "sold" | "archived";
          is_featured: boolean;
          is_weekly_opportunity: boolean;
          opportunity_deadline: string | null;
          featured_order: number | null;
          damage_summary: string | null;
          condition_notes: string | null;
          damage_tags: string[];
          public_tags: string[];
          location_label: string | null;
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          created_at: string;
        };
      };
    };
    Functions: {
      create_public_vehicle_lead: {
        Args: {
          p_vehicle_id: string;
          p_source_page: string;
          p_name: string;
          p_phone: string;
          p_email?: string | null;
          p_message?: string | null;
          p_idempotency_key?: string | null;
          p_utm_source?: string | null;
          p_utm_medium?: string | null;
          p_utm_campaign?: string | null;
          p_user_agent?: string | null;
        };
        Returns: {
          public_reference: string;
          created: boolean;
        }[];
      };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      admin_role: "admin" | "editor";
      vehicle_category: "accidentado" | "recuperado" | "seminuevo";
      vehicle_status: "draft" | "available" | "reserved" | "sold" | "archived";
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "lost"
        | "spam"
        | "archived";
      business_unit:
        | "inventory"
        | "opportunities"
        | "workshop"
        | "keys"
        | "general";
    };
  };
};
