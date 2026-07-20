import { revalidatePath } from "next/cache";
import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";

const CATEGORY_PUBLIC_PATH: Record<VehicleCategory, string> = {
  accidentado: "/vehiculos/accidentados",
  recuperado: "/vehiculos/recuperados",
  seminuevo: "/vehiculos/seminuevos",
};

/**
 * Invalidate public + admin surfaces after vehicle mutations.
 * Uses layout-scoped revalidation so nested RSC payloads and Data Cache clear.
 */
export function revalidateVehicleSurfaces(input?: {
  slug?: string | null;
  vehicleId?: string | null;
  category?: VehicleCategory | null;
}): void {
  const bust = (path: string) => {
    revalidatePath(path, "layout");
    revalidatePath(path, "page");
  };

  bust("/admin/vehiculos");
  bust("/vehiculos");
  bust("/subastas");
  bust("/oportunidades");
  bust("/");
  bust("/inventario");

  if (input?.category) {
    const categoryPath = CATEGORY_PUBLIC_PATH[input.category];
    if (categoryPath) bust(categoryPath);
    // Always refresh sibling category hubs too (category may have changed).
    bust("/vehiculos/accidentados");
    bust("/vehiculos/recuperados");
    bust("/vehiculos/seminuevos");
  } else {
    bust("/vehiculos/accidentados");
    bust("/vehiculos/recuperados");
    bust("/vehiculos/seminuevos");
  }

  if (input?.slug) {
    bust(`/vehiculos/${input.slug}`);
    bust(`/inventario/${input.slug}`);
  }

  if (input?.vehicleId) {
    bust(`/admin/vehiculos/${input.vehicleId}`);
    bust(`/admin/vehiculos/${input.vehicleId}/editar`);
    bust(`/admin/vehiculos/${input.vehicleId}/preview`);
  }
}
