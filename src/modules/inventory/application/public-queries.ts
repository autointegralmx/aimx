import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";

export async function getInventoryServerContext() {
  const client = await createSupabaseServerClient();
  return {
    client,
    repo: createVehicleRepository(client),
    mediaRepo: createVehicleMediaRepository(client),
  };
}

export async function loadCoverUrlsForVehicles(
  vehicleIds: string[],
): Promise<Map<string, string>> {
  if (vehicleIds.length === 0) return new Map();
  const { mediaRepo } = await getInventoryServerContext();
  const map = new Map<string, string>();

  // Batch per vehicle is fine for Phase 4 scale; list endpoints stay small.
  await Promise.all(
    vehicleIds.map(async (id) => {
      const media = await mediaRepo.listVehicleMedia(id);
      const cover = media.find((item) => item.is_cover) ?? media[0];
      if (cover) map.set(id, cover.url);
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
