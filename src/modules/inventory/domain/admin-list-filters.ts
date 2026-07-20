import { z } from "zod";
import {
  vehicleCategorySchema,
  vehicleStatusSchema,
  type VehicleCategory,
  type VehicleStatus,
} from "@/modules/inventory/domain/vehicle-schema";

export const ADMIN_VEHICLES_PAGE_SIZE = 20;

const triStateSchema = z.enum(["all", "yes", "no"]).default("all");

export const adminVehicleListParamsSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  category: vehicleCategorySchema.or(z.literal("all")).default("all"),
  status: vehicleStatusSchema.or(z.literal("all")).default("all"),
  published: triStateSchema,
  featured: triStateSchema,
  opportunity: triStateSchema,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(ADMIN_VEHICLES_PAGE_SIZE),
});

export type AdminVehicleListFilters = z.infer<
  typeof adminVehicleListParamsSchema
>;

export type TriStateFilter = "all" | "yes" | "no";

export function parseAdminVehicleListParams(
  input: Record<string, string | string[] | undefined>,
): AdminVehicleListFilters {
  const pick = (key: string): string | undefined => {
    const value = input[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const parsed = adminVehicleListParamsSchema.safeParse({
    q: pick("q") ?? "",
    category: pick("category") ?? "all",
    status: pick("status") ?? "all",
    published: pick("published") ?? "all",
    featured: pick("featured") ?? "all",
    opportunity: pick("opportunity") ?? "all",
    page: pick("page") ?? "1",
    pageSize: pick("pageSize") ?? String(ADMIN_VEHICLES_PAGE_SIZE),
  });

  if (!parsed.success) {
    return adminVehicleListParamsSchema.parse({});
  }

  return parsed.data;
}

export function hasActiveAdminVehicleFilters(
  filters: AdminVehicleListFilters,
): boolean {
  return Boolean(
    filters.q ||
      filters.category !== "all" ||
      filters.status !== "all" ||
      filters.published !== "all" ||
      filters.featured !== "all" ||
      filters.opportunity !== "all",
  );
}

export function buildAdminVehiclesHref(
  filters: Partial<AdminVehicleListFilters>,
): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.published && filters.published !== "all") {
    params.set("published", filters.published);
  }
  if (filters.featured && filters.featured !== "all") {
    params.set("featured", filters.featured);
  }
  if (filters.opportunity && filters.opportunity !== "all") {
    params.set("opportunity", filters.opportunity);
  }
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  const qs = params.toString();
  return qs ? `/admin/vehiculos?${qs}` : "/admin/vehiculos";
}

export function triStateToBoolean(value: TriStateFilter): boolean | undefined {
  if (value === "all") return undefined;
  return value === "yes";
}

export type AdminListFilterLabels = {
  category: VehicleCategory | "all";
  status: VehicleStatus | "all";
};
