import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import { VehicleForm } from "@/modules/inventory/ui/vehicle-form";

export const metadata = {
  title: "Admin | Editar vehículo",
  robots: { index: false, follow: false },
};

export default async function AdminEditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaffProfile();
  const client = await createSupabaseServerClient();
  const repo = createVehicleRepository(client);
  const mediaRepo = createVehicleMediaRepository(client);
  const vehicle = await repo.getAdminVehicleById(id);
  if (!vehicle) notFound();
  const images = await mediaRepo.listVehicleMedia(id);

  return (
    <AdminShell title="Editar vehículo">
      <p className="text-sm text-ink-muted">
        <Link
          href={`/admin/vehiculos/${vehicle.id}`}
          className="text-accent hover:underline"
        >
          ← Volver al detalle
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
        Editar vehículo
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        {vehicle.year} {vehicle.make} {vehicle.model}
        {vehicle.version ? ` ${vehicle.version}` : ""}
      </p>
      <div className="mt-8">
        <VehicleForm vehicle={vehicle} images={images} />
      </div>
    </AdminShell>
  );
}
