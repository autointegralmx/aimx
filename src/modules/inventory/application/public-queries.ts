import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import {
  logServerError,
  readPublicSupabaseEnv,
} from "@/shared/lib/supabase/env";
import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";

export async function getInventoryServerContext() {
  const client = await createSupabaseServerClient();
  return {
    client,
    repo: createVehicleRepository(client),
    mediaRepo: createVehicleMediaRepository(client),
  };
}

export async function getInventoryServerContextOrNull() {
  const env = readPublicSupabaseEnv();
  if (!env.configured) {
    logServerError("inventory-context", new Error("supabase_env_missing"), {
      operation: "getInventoryServerContextOrNull",
    });
    return null;
  }
  try {
    return await getInventoryServerContext();
  } catch (error) {
    logServerError("inventory-context", error, {
      operation: "getInventoryServerContextOrNull",
    });
    return null;
  }
}

export async function loadCoverUrlsForVehicles(
  vehicleIds: string[],
): Promise<Map<string, string>> {
  if (vehicleIds.length === 0) return new Map();
  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return new Map();
  const map = new Map<string, string>();

  await Promise.all(
    vehicleIds.map(async (id) => {
      try {
        const media = await ctx.mediaRepo.listVehicleMedia(id);
        const cover = media.find((item) => item.is_cover) ?? media[0];
        if (cover?.url) map.set(id, cover.url);
      } catch (error) {
        logServerError("inventory-covers", error, {
          operation: "listVehicleMedia",
          vehicleIdPresent: Boolean(id),
        });
      }
    }),
  );

  return map;
}

export function withCovers(
  vehicles: PublicVehicle[],
  covers: Map<string, string>,
) {
  return vehicles.map((vehicle) => ({
    vehicle,
    coverUrl: vehicle.id ? covers.get(vehicle.id) ?? null : null,
  }));
}

export type HomeInventoryData = {
  auctions: ReturnType<typeof withCovers>;
  /** @deprecated use auctions */
  opportunities: ReturnType<typeof withCovers>;
  featured: ReturnType<typeof withCovers>;
  degraded: boolean;
};

export async function loadHomeInventoryData(): Promise<HomeInventoryData> {
  const empty: HomeInventoryData = {
    auctions: [],
    opportunities: [],
    featured: [],
    degraded: true,
  };

  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return empty;

  try {
    const [auctionsResult, featuredResult] = await Promise.allSettled([
      ctx.repo.listActiveAuctions({ limit: 3 }),
      ctx.repo.listPublicVehicles({ featured: true, limit: 3 }),
    ]);

    const auctions =
      auctionsResult.status === "fulfilled" ? auctionsResult.value : [];
    const featured =
      featuredResult.status === "fulfilled" ? featuredResult.value : [];

    if (auctionsResult.status === "rejected") {
      logServerError("public-home", auctionsResult.reason, {
        operation: "listActiveAuctions",
      });
    }
    if (featuredResult.status === "rejected") {
      logServerError("public-home", featuredResult.reason, {
        operation: "listPublicVehicles.featured",
      });
    }

    const coverIds = [
      ...auctions.map((item) => item.id),
      ...featured.map((item) => item.id),
    ].filter((id): id is string => Boolean(id));
    const covers = await loadCoverUrlsForVehicles(coverIds);
    const auctionsWithCovers = withCovers(auctions, covers);

    return {
      auctions: auctionsWithCovers,
      opportunities: auctionsWithCovers,
      featured: withCovers(featured, covers),
      degraded:
        auctionsResult.status === "rejected" ||
        featuredResult.status === "rejected",
    };
  } catch (error) {
    logServerError("public-home", error, { operation: "loadHomeInventoryData" });
    return empty;
  }
}

/**
 * Listado público de inventario propio.
 * - `mode: "all"` (default): colección completa publicada de la categoría/filtro.
 * - `mode: "preview"`: requiere `limit` explícito (p. ej. home con 3).
 */
export async function loadPublicVehicleList(input: {
  category?: VehicleCategory;
  featured?: boolean;
  mode?: "all" | "preview";
  /** Solo aplica con `mode: "preview"`. Nunca se usa por defecto en listados completos. */
  limit?: number;
}): Promise<{ items: ReturnType<typeof withCovers>; degraded: boolean }> {
  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return { items: [], degraded: true };

  const mode = input.mode ?? "all";
  const previewLimit =
    mode === "preview" && typeof input.limit === "number" && input.limit > 0
      ? input.limit
      : undefined;

  try {
    const vehicles = await ctx.repo.listPublicVehicles({
      category: input.category,
      featured: input.featured,
      ...(previewLimit !== undefined ? { limit: previewLimit } : {}),
    });
    const covers = await loadCoverUrlsForVehicles(
      vehicles.map((item) => item.id).filter((id): id is string => Boolean(id)),
    );
    return { items: withCovers(vehicles, covers), degraded: false };
  } catch (error) {
    logServerError("public-vehicles", error, {
      operation: "loadPublicVehicleList",
      category: input.category ?? null,
    });
    return { items: [], degraded: true };
  }
}

/**
 * Subastas públicas.
 * Sin `limit` → listado completo (/subastas). Con `limit` → preview (home).
 */
export async function loadPublicAuctions(limit?: number): Promise<{
  items: ReturnType<typeof withCovers>;
  degraded: boolean;
}> {
  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return { items: [], degraded: true };

  try {
    const vehicles = await ctx.repo.listActiveAuctions(
      typeof limit === "number" && limit > 0 ? { limit } : {},
    );
    const covers = await loadCoverUrlsForVehicles(
      vehicles.map((item) => item.id).filter((id): id is string => Boolean(id)),
    );
    return { items: withCovers(vehicles, covers), degraded: false };
  } catch (error) {
    logServerError("public-auctions", error, {
      operation: "loadPublicAuctions",
    });
    return { items: [], degraded: true };
  }
}

/** @deprecated use loadPublicAuctions */
export async function loadPublicOpportunities(limit?: number) {
  return loadPublicAuctions(limit);
}
