import { revalidatePath } from "next/cache";
import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";

const CATEGORY_PUBLIC_PATH: Record<VehicleCategory, string> = {
  accidentado: "/vehiculos/accidentados",
  recuperado: "/vehiculos/recuperados",
  seminuevo: "/vehiculos/seminuevos",
};

export function revalidateVehicleSurfaces(input?: {
  slug?: string | null;
  vehicleId?: string | null;
  category?: VehicleCategory | null;
}): void {
  revalidatePath("/admin/vehiculos");
  revalidatePath("/vehiculos");
  revalidatePath("/subastas");
  revalidatePath("/oportunidades");
  revalidatePath("/");
  if (input?.category) {
    const categoryPath = CATEGORY_PUBLIC_PATH[input.category];
    if (categoryPath) revalidatePath(categoryPath);
  } else {
    revalidatePath("/vehiculos/accidentados");
    revalidatePath("/vehiculos/recuperados");
    revalidatePath("/vehiculos/seminuevos");
  }
  if (input?.slug) {
    revalidatePath(`/vehiculos/${input.slug}`);
  }
  if (input?.vehicleId) {
    revalidatePath(`/admin/vehiculos/${input.vehicleId}`);
    revalidatePath(`/admin/vehiculos/${input.vehicleId}/editar`);
    revalidatePath(`/admin/vehiculos/${input.vehicleId}/preview`);
  }
}
