import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/database.types";
import type {
  VehicleCategory,
  VehicleDraftInput,
  VehicleStatus,
  VehicleWriteInput,
} from "@/modules/inventory/domain/vehicle-schema";
import {
  triStateToBoolean,
  type AdminVehicleListFilters,
} from "@/modules/inventory/domain/admin-list-filters";
import { buildVehicleSlug } from "@/modules/inventory/domain/slug";
import type { VehicleLifecyclePatch } from "@/modules/inventory/domain/vehicle-lifecycle";
import { isPublicAuctionVehicle } from "@/modules/inventory/domain/vehicle-auction";
import { readPublicSupabaseEnv } from "@/shared/lib/supabase/env";

export type InventorySupabase = SupabaseClient<Database>;

type VehiclesRow = Database["public"]["Tables"]["vehicles"]["Row"];
type VehiclesInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
type VehiclesUpdate = Database["public"]["Tables"]["vehicles"]["Update"];
type VehiclesPublicRow = Database["public"]["Views"]["vehicles_public"]["Row"];

export const ADMIN_VEHICLE_LIST_COLUMNS = [
  "id",
  "slug",
  "stock_code",
  "category",
  "make",
  "model",
  "version",
  "year",
  "status",
  "is_published",
  "is_featured",
  "is_weekly_opportunity",
  "opportunity_deadline",
  "public_title",
  "updated_at",
  "created_at",
  "deleted_at",
] as const;

export const PUBLIC_VEHICLE_BASE_COLUMNS = [
  "id",
  "slug",
  "category",
  "make",
  "model",
  "version",
  "year",
  "body_type",
  "mileage_km",
  "transmission",
  "fuel_type",
  "exterior_color",
  "public_title",
  "short_description",
  "full_description",
  "price_amount",
  "price_label",
  "currency",
  "status",
  "is_featured",
  "is_weekly_opportunity",
  "opportunity_deadline",
  "featured_order",
  "damage_summary",
  "condition_notes",
  "damage_tags",
  "public_tags",
  "location_label",
  "seo_title",
  "seo_description",
  "published_at",
  "created_at",
] as const;

export const PUBLIC_VEHICLE_OPERATIONAL_COLUMNS = [
  "starts_status",
  "drives_status",
  "has_keys_status",
  "airbags_status",
  "invoice_type",
  "invoice_entity",
  "tenencias_label",
  "verification_status",
  "publish_observations",
] as const;

export const PUBLIC_VEHICLE_COLUMNS = [
  ...PUBLIC_VEHICLE_BASE_COLUMNS,
  ...PUBLIC_VEHICLE_OPERATIONAL_COLUMNS,
] as const;

const OPERATIONAL_WRITE_KEYS = [
  ...PUBLIC_VEHICLE_OPERATIONAL_COLUMNS,
] as const;

export type AdminVehicleListItem = Pick<
  VehiclesRow,
  (typeof ADMIN_VEHICLE_LIST_COLUMNS)[number]
> & {
  cover_url: string | null;
};

export type AdminVehicleDetail = VehiclesRow & {
  cover_url: string | null;
};

export type PublicVehicle = Pick<
  VehiclesPublicRow,
  (typeof PUBLIC_VEHICLE_BASE_COLUMNS)[number]
> & {
  starts_status?: string | null;
  drives_status?: string | null;
  has_keys_status?: string | null;
  airbags_status?: string | null;
  invoice_type?: string | null;
  invoice_entity?: string | null;
  tenencias_label?: string | null;
  verification_status?: string | null;
  publish_observations?: boolean | null;
};

export type ListAdminVehiclesResult = {
  items: AdminVehicleListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ListPublicVehiclesInput = {
  category?: VehicleCategory;
  featured?: boolean;
  limit?: number;
  offset?: number;
};

function isMissingColumnError(message: string): boolean {
  return /column|does not exist|schema cache/i.test(message);
}

function normalizePublicVehicle(
  row: Partial<PublicVehicle> | null | undefined,
): PublicVehicle | null {
  if (!row) return null;
  return {
    ...row,
    starts_status: row.starts_status ?? "unknown",
    drives_status: row.drives_status ?? "unknown",
    has_keys_status: row.has_keys_status ?? "unknown",
    airbags_status: row.airbags_status ?? "unknown",
    invoice_type: row.invoice_type ?? "unknown",
    invoice_entity: row.invoice_entity ?? null,
    tenencias_label: row.tenencias_label ?? null,
    verification_status: row.verification_status ?? "unknown",
    publish_observations: row.publish_observations ?? true,
  } as PublicVehicle;
}

function stripOperationalWriteFields(
  update: VehiclesUpdate,
): VehiclesUpdate {
  const next = { ...update };
  for (const key of OPERATIONAL_WRITE_KEYS) {
    delete (next as Record<string, unknown>)[key];
  }
  return next;
}

function publicStorageUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`;
}

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, "\\$&");
}

export function createVehicleRepository(
  client: InventorySupabase,
  options?: { supabaseUrl?: string },
) {
  const supabaseUrl =
    options?.supabaseUrl ?? readPublicSupabaseEnv().url ?? "";

  async function loadCoverMap(
    vehicleIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (vehicleIds.length === 0 || !supabaseUrl) return map;

    const { data, error } = await client
      .from("vehicle_media")
      .select(
        "vehicle_id, is_cover, media_assets ( bucket, object_path, deleted_at )",
      )
      .in("vehicle_id", vehicleIds)
      .eq("is_cover", true);

    if (error || !data) return map;

    for (const row of data) {
      const asset = row.media_assets;
      if (!asset || Array.isArray(asset)) continue;
      if (asset.deleted_at) continue;
      map.set(
        row.vehicle_id,
        publicStorageUrl(supabaseUrl, asset.bucket, asset.object_path),
      );
    }

    return map;
  }

  return {
    async listAdminVehicles(
      filters: AdminVehicleListFilters,
    ): Promise<ListAdminVehiclesResult> {
      const page = filters.page;
      const pageSize = filters.pageSize;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = client
        .from("vehicles")
        .select(ADMIN_VEHICLE_LIST_COLUMNS.join(", "), { count: "exact" })
        .is("deleted_at", null);

      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const published = triStateToBoolean(filters.published);
      if (published !== undefined) {
        query = query.eq("is_published", published);
      }
      const featured = triStateToBoolean(filters.featured);
      if (featured !== undefined) {
        query = query.eq("is_featured", featured);
      }
      const auction = triStateToBoolean(
        filters.auction !== "all" ? filters.auction : filters.opportunity,
      );
      if (auction !== undefined) {
        query = query.eq("is_weekly_opportunity", auction);
      }

      const q = filters.q.trim();
      if (q) {
        const term = `%${escapeIlike(q)}%`;
        query = query.or(
          `make.ilike.${term},model.ilike.${term},version.ilike.${term},stock_code.ilike.${term}`,
        );
      }

      query = query
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) {
        throw new Error(`No se pudo listar vehículos: ${error.message}`);
      }

      const rows = (data ?? []) as unknown as Array<
        Pick<VehiclesRow, (typeof ADMIN_VEHICLE_LIST_COLUMNS)[number]>
      >;
      const coverMap = await loadCoverMap(rows.map((row) => row.id));
      const total = count ?? 0;
      const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);

      return {
        items: rows.map((row) => ({
          ...row,
          cover_url: coverMap.get(row.id) ?? null,
        })),
        total,
        page,
        pageSize,
        pageCount,
      };
    },

    async getAdminVehicleById(id: string): Promise<AdminVehicleDetail | null> {
      const { data, error } = await client
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw new Error(`No se pudo cargar el vehículo: ${error.message}`);
      }
      if (!data) return null;

      const coverMap = await loadCoverMap([data.id]);
      return { ...data, cover_url: coverMap.get(data.id) ?? null };
    },

    async createVehicleDraft(
      input: VehicleDraftInput,
      actorId: string,
    ): Promise<VehiclesRow> {
      const baseSlug = buildVehicleSlug(input);
      const slug = await ensureUniqueSlug(client, baseSlug);

      const payload: VehiclesInsert = {
        slug,
        make: input.make,
        model: input.model,
        year: input.year,
        category: input.category,
        status: "draft",
        is_published: false,
        is_featured: false,
        is_weekly_opportunity: false,
        created_by: actorId,
        updated_by: actorId,
      };

      const { data, error } = await client
        .from("vehicles")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(
          `No se pudo crear el borrador: ${error?.message ?? "sin datos"}`,
        );
      }
      return data;
    },

    async updateVehicle(
      id: string,
      input: Partial<VehicleWriteInput>,
      actorId: string,
    ): Promise<VehiclesRow> {
      const update: VehiclesUpdate = {
        ...mapWriteInputToUpdate(input),
        updated_by: actorId,
      };

      if (typeof input.slug === "string" && input.slug.trim()) {
        update.slug = await ensureUniqueSlug(client, input.slug.trim(), id);
      }

      let { data, error } = await client
        .from("vehicles")
        .update(update)
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .single();

      if (
        error &&
        isMissingColumnError(error.message) &&
        OPERATIONAL_WRITE_KEYS.some((key) => key in update)
      ) {
        const fallback = stripOperationalWriteFields(update);
        const retry = await client
          .from("vehicles")
          .update(fallback)
          .eq("id", id)
          .is("deleted_at", null)
          .select("*")
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error || !data) {
        throw new Error(
          `No se pudo actualizar el vehículo: ${error?.message ?? "sin datos"}`,
        );
      }
      return data;
    },

    async applyLifecyclePatch(
      id: string,
      patch: VehicleLifecyclePatch,
      actorId: string,
    ): Promise<VehiclesRow> {
      const update: VehiclesUpdate = {
        ...patch,
        updated_by: actorId,
      };

      const { data, error } = await client
        .from("vehicles")
        .update(update)
        .eq("id", id)
        .is("deleted_at", null)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(
          `No se pudo actualizar el estado: ${error?.message ?? "sin datos"}`,
        );
      }
      return data;
    },

    async duplicateVehicle(
      id: string,
      actorId: string,
    ): Promise<VehiclesRow> {
      const source = await this.getAdminVehicleById(id);
      if (!source) {
        throw new Error("El vehículo a duplicar no existe.");
      }

      const baseSlug = `${source.slug}-copia`;
      const slug = await ensureUniqueSlug(client, baseSlug);

      const payload: VehiclesInsert = {
        slug,
        category: source.category,
        make: source.make,
        model: source.model,
        version: source.version,
        year: source.year,
        body_type: source.body_type,
        mileage_km: source.mileage_km,
        transmission: source.transmission,
        fuel_type: source.fuel_type,
        exterior_color: source.exterior_color,
        public_title: source.public_title,
        short_description: source.short_description,
        full_description: source.full_description,
        public_description: source.public_description,
        price_amount: source.price_amount,
        price_label: source.price_label,
        currency: source.currency,
        damage_summary: source.damage_summary,
        condition_notes: source.condition_notes,
        damage_tags: source.damage_tags,
        public_tags: source.public_tags,
        location_label: source.location_label,
        seo_title: source.seo_title,
        seo_description: source.seo_description,
        status: "draft",
        is_published: false,
        is_featured: false,
        is_weekly_opportunity: false,
        published_at: null,
        opportunity_deadline: null,
        featured_order: null,
        stock_code: null,
        vin: null,
        provider_reference: null,
        internal_price: null,
        private_notes: null,
        created_by: actorId,
        updated_by: actorId,
      };

      const { data, error } = await client
        .from("vehicles")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(
          `No se pudo duplicar el vehículo: ${error?.message ?? "sin datos"}`,
        );
      }
      return data;
    },

    async listPublicVehicles(
      input: ListPublicVehiclesInput = {},
    ): Promise<PublicVehicle[]> {
      const limit = input.limit ?? 24;
      const offset = input.offset ?? 0;

      async function runSelect(columns: string) {
        let query = client
          .from("vehicles_public")
          .select(columns)
          .order("published_at", { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1);
        if (input.category) query = query.eq("category", input.category);
        if (input.featured !== undefined) {
          query = query.eq("is_featured", input.featured);
        }
        return query;
      }

      let { data, error } = await runSelect(PUBLIC_VEHICLE_COLUMNS.join(", "));
      if (error && isMissingColumnError(error.message)) {
        ({ data, error } = await runSelect(
          PUBLIC_VEHICLE_BASE_COLUMNS.join(", "),
        ));
      }

      if (error) {
        throw new Error(`No se pudo listar vehículos públicos: ${error.message}`);
      }
      return ((data as unknown as PublicVehicle[]) ?? [])
        .map((row) => normalizePublicVehicle(row))
        .filter((row): row is PublicVehicle => row != null);
    },

    async getPublicVehicleBySlug(
      slug: string,
    ): Promise<PublicVehicle | null> {
      let { data, error } = await client
        .from("vehicles_public")
        .select(PUBLIC_VEHICLE_COLUMNS.join(", "))
        .eq("slug", slug)
        .maybeSingle();

      if (error && isMissingColumnError(error.message)) {
        ({ data, error } = await client
          .from("vehicles_public")
          .select(PUBLIC_VEHICLE_BASE_COLUMNS.join(", "))
          .eq("slug", slug)
          .maybeSingle());
      }

      if (error) {
        throw new Error(`No se pudo cargar el vehículo público: ${error.message}`);
      }
      return normalizePublicVehicle(data as unknown as PublicVehicle | null);
    },

    async listActiveAuctions(input?: {
      limit?: number;
      now?: Date;
    }): Promise<PublicVehicle[]> {
      const now = input?.now ?? new Date();
      const limit = input?.limit ?? 24;
      const nowIso = now.toISOString();

      let { data, error } = await client
        .from("vehicles_public")
        .select(PUBLIC_VEHICLE_COLUMNS.join(", "))
        .eq("is_weekly_opportunity", true)
        .eq("status", "available")
        .gt("opportunity_deadline", nowIso)
        .order("opportunity_deadline", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error && isMissingColumnError(error.message)) {
        ({ data, error } = await client
          .from("vehicles_public")
          .select(PUBLIC_VEHICLE_BASE_COLUMNS.join(", "))
          .eq("is_weekly_opportunity", true)
          .eq("status", "available")
          .gt("opportunity_deadline", nowIso)
          .order("opportunity_deadline", { ascending: true, nullsFirst: false })
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(limit));
      }

      if (error) {
        throw new Error(`No se pudieron listar subastas: ${error.message}`);
      }

      const rows = ((data as unknown as PublicVehicle[]) ?? [])
        .map((row) => normalizePublicVehicle(row))
        .filter((row): row is PublicVehicle => row != null);

      return rows.filter((row) =>
        isPublicAuctionVehicle({
          is_published: true,
          is_weekly_opportunity: Boolean(row.is_weekly_opportunity),
          status: (row.status ?? "draft") as VehicleStatus,
          opportunity_deadline: row.opportunity_deadline,
          now,
        }),
      );
    },

    /** @deprecated use listActiveAuctions */
    async listActiveOpportunities(input?: {
      limit?: number;
      now?: Date;
    }): Promise<PublicVehicle[]> {
      return this.listActiveAuctions(input);
    },
  };
}

export type VehicleRepository = ReturnType<typeof createVehicleRepository>;

async function ensureUniqueSlug(
  client: InventorySupabase,
  base: string,
  excludeId?: string,
): Promise<string> {
  const normalized = base.slice(0, 140) || "vehiculo";
  let candidate = normalized;
  let attempt = 2;

  for (;;) {
    let query = client
      .from("vehicles")
      .select("id")
      .eq("slug", candidate)
      .is("deleted_at", null);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`No se pudo validar slug: ${error.message}`);
    }
    if (!data) return candidate;
    candidate = `${normalized}-${attempt}`;
    attempt += 1;
    if (attempt > 50) {
      candidate = `${normalized}-${Date.now()}`;
      return candidate;
    }
  }
}

function mapWriteInputToUpdate(
  input: Partial<VehicleWriteInput>,
): VehiclesUpdate {
  const update: VehiclesUpdate = {};
  const keys = Object.keys(input) as Array<keyof VehicleWriteInput>;
  for (const key of keys) {
    const value = input[key];
    if (value === undefined) continue;
    (update as Record<string, unknown>)[key] = value;
  }
  return update;
}

/** Pure helper for unit tests: apply search term match without DB. */
export function adminVehicleMatchesSearch(
  vehicle: {
    make: string;
    model: string;
    version?: string | null;
    stock_code?: string | null;
  },
  q: string,
): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    vehicle.make,
    vehicle.model,
    vehicle.version ?? "",
    vehicle.stock_code ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

export function sortAdminVehiclesByUpdated(
  items: Array<{ updated_at: string; created_at: string }>,
): Array<{ updated_at: string; created_at: string }> {
  return [...items].sort((a, b) => {
    const updated = b.updated_at.localeCompare(a.updated_at);
    if (updated !== 0) return updated;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageSize: number; pageCount: number } {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}
