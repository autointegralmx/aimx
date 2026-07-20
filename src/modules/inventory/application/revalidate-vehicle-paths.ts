import { revalidatePath } from "next/cache";

export function revalidateVehicleSurfaces(input?: {
  slug?: string | null;
  vehicleId?: string | null;
}): void {
  revalidatePath("/admin/vehiculos");
  revalidatePath("/vehiculos");
  revalidatePath("/subastas");
  revalidatePath("/oportunidades");
  revalidatePath("/");
  if (input?.slug) {
    revalidatePath(`/vehiculos/${input.slug}`);
  }
  if (input?.vehicleId) {
    revalidatePath(`/admin/vehiculos/${input.vehicleId}`);
    revalidatePath(`/admin/vehiculos/${input.vehicleId}/editar`);
    revalidatePath(`/admin/vehiculos/${input.vehicleId}/preview`);
  }
}
