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
  opportunities: ReturnType<typeof withCovers>;
  featured: ReturnType<typeof withCovers>;
  degraded: boolean;
};

export async function loadHomeInventoryData(): Promise<HomeInventoryData> {
  const empty: HomeInventoryData = {
    opportunities: [],
    featured: [],
    degraded: true,
  };

  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return empty;

  try {
    const [opportunitiesResult, featuredResult] = await Promise.allSettled([
      ctx.repo.listActiveOpportunities({ limit: 3 }),
      ctx.repo.listPublicVehicles({ featured: true, limit: 3 }),
    ]);

    const opportunities =
      opportunitiesResult.status === "fulfilled"
        ? opportunitiesResult.value
        : [];
    const featured =
      featuredResult.status === "fulfilled" ? featuredResult.value : [];

    if (opportunitiesResult.status === "rejected") {
      logServerError("public-home", opportunitiesResult.reason, {
        operation: "listActiveOpportunities",
      });
    }
    if (featuredResult.status === "rejected") {
      logServerError("public-home", featuredResult.reason, {
        operation: "listPublicVehicles.featured",
      });
    }

    const coverIds = [
      ...opportunities.map((item) => item.id),
      ...featured.map((item) => item.id),
    ].filter((id): id is string => Boolean(id));
    const covers = await loadCoverUrlsForVehicles(coverIds);

    return {
      opportunities: withCovers(opportunities, covers),
      featured: withCovers(featured, covers),
      degraded:
        opportunitiesResult.status === "rejected" ||
        featuredResult.status === "rejected",
    };
  } catch (error) {
    logServerError("public-home", error, { operation: "loadHomeInventoryData" });
    return empty;
  }
}

export async function loadPublicVehicleList(input: {
  category?: VehicleCategory;
  limit?: number;
  featured?: boolean;
}): Promise<{ items: ReturnType<typeof withCovers>; degraded: boolean }> {
  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return { items: [], degraded: true };

  try {
    const vehicles = await ctx.repo.listPublicVehicles({
      category: input.category,
      limit: input.limit ?? 24,
      featured: input.featured,
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

export async function loadPublicOpportunities(limit = 24): Promise<{
  items: ReturnType<typeof withCovers>;
  degraded: boolean;
}> {
  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return { items: [], degraded: true };

  try {
    const vehicles = await ctx.repo.listActiveOpportunities({ limit });
    const covers = await loadCoverUrlsForVehicles(
      vehicles.map((item) => item.id).filter((id): id is string => Boolean(id)),
    );
    return { items: withCovers(vehicles, covers), degraded: false };
  } catch (error) {
    logServerError("public-opportunities", error, {
      operation: "loadPublicOpportunities",
    });
    return { items: [], degraded: true };
  }
}
