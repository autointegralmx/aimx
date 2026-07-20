import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import { toPublicVehicleFromAdmin } from "@/modules/inventory/domain/to-public-vehicle";
import { PublicVehicleDetail } from "@/modules/inventory/ui/public-vehicle-detail";

export const metadata = {
  title: "Admin | Vista previa",
  robots: { index: false, follow: false },
};

export default async function AdminVehiclePreviewPage({
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
  const publicShape = toPublicVehicleFromAdmin(vehicle);

  return (
    <AdminShell title="Vista previa">
      <p className="mb-6 text-sm text-ink-muted">
        <Link
          href={`/admin/vehiculos/${vehicle.id}/editar`}
          className="text-accent hover:underline"
        >
          ← Volver a edición
        </Link>
      </p>
      <PublicVehicleDetail
        vehicle={publicShape}
        images={images}
        preview
      />
    </AdminShell>
  );
}
