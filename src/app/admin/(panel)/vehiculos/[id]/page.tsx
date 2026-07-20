import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  formatVehicleTitle,
  statusBadgeTone,
  vehicleCategoryLabel,
  vehicleStatusLabel,
} from "@/modules/inventory/domain/vehicle-labels";
import { FlagBadge, StatusBadge } from "@/modules/inventory/ui/status-badge";
import { VehicleActionsMenu } from "@/modules/inventory/ui/vehicle-actions-menu";

export const metadata = {
  title: "Admin | Detalle vehículo",
  robots: { index: false, follow: false },
};

export default async function AdminVehicleDetailPage({
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
  const title = formatVehicleTitle(vehicle);
  const cover = images.find((item) => item.is_cover) ?? images[0] ?? null;

  return (
    <AdminShell title="Detalle">
      <p className="text-sm text-ink-muted">
        <Link href="/admin/vehiculos" className="text-accent hover:underline">
          ← Volver a vehículos
        </Link>
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-md bg-surface">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover.url}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-ink-subtle">
                Sin portada
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            {images.length} fotografía{images.length === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink">
                {title}
              </h1>
              {vehicle.stock_code ? (
                <p className="mt-1 text-sm text-ink-muted">
                  Folio {vehicle.stock_code}
                </p>
              ) : null}
            </div>
            <VehicleActionsMenu vehicle={vehicle} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone={statusBadgeTone(vehicle.status)}>
              {vehicleStatusLabel[vehicle.status]}
            </StatusBadge>
            <FlagBadge
              active={vehicle.is_published}
              activeLabel="Publicado"
              inactiveLabel="No publicado"
            />
            <FlagBadge
              active={vehicle.is_featured}
              activeLabel="Destacado"
              inactiveLabel="No destacado"
            />
            <FlagBadge
              active={vehicle.is_weekly_opportunity}
              activeLabel="Oportunidad"
              inactiveLabel="Sin oportunidad"
            />
          </div>

          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">Categoría</dt>
              <dd className="font-medium text-ink">
                {vehicleCategoryLabel[vehicle.category]}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Slug</dt>
              <dd className="font-medium text-ink">{vehicle.slug}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Actualizado</dt>
              <dd className="font-medium text-ink">
                {new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(vehicle.updated_at))}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Título público</dt>
              <dd className="font-medium text-ink">
                {vehicle.public_title || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/admin/vehiculos/${vehicle.id}/editar`}
              className="btn-dark touch-target inline-flex"
            >
              Editar
            </Link>
            <Link
              href={`/admin/vehiculos/${vehicle.id}/preview`}
              className="btn-secondary touch-target inline-flex"
            >
              Vista previa
            </Link>
            {vehicle.is_published ? (
              <Link
                href={`/vehiculos/${vehicle.slug}`}
                className="touch-target inline-flex items-center border border-line px-4 text-sm font-medium"
                target="_blank"
                rel="noreferrer"
              >
                Ver públicamente
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
