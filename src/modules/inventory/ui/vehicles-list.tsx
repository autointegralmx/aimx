import type { AdminVehicleListItem } from "@/modules/inventory/infrastructure/vehicle-repository";
import {
  formatVehicleTitle,
  statusBadgeTone,
  vehicleCategoryLabel,
  vehicleStatusLabel,
} from "@/modules/inventory/domain/vehicle-labels";
import { FlagBadge, StatusBadge } from "@/modules/inventory/ui/status-badge";
import { VehicleActionsMenu } from "@/modules/inventory/ui/vehicle-actions-menu";

function CoverThumb({
  url,
  alt,
}: {
  url: string | null;
  alt: string;
}) {
  if (!url) {
    return (
      <div
        className="flex h-14 w-20 items-center justify-center rounded-sm bg-surface text-[10px] font-medium uppercase tracking-wide text-ink-subtle"
        aria-hidden
      >
        Sin foto
      </div>
    );
  }

  return (
    <div className="relative h-14 w-20 overflow-hidden rounded-sm bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote storage URLs vary in local */}
      <img src={url} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

function formatUpdatedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function VehiclesDesktopTable({
  items,
}: {
  items: AdminVehicleListItem[];
}) {
  return (
    <div className="hidden rounded-md border border-line bg-paper-elevated md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Portada</th>
            <th className="px-4 py-3 font-medium">Vehículo</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Publicado</th>
            <th className="px-4 py-3 font-medium">Destacado</th>
            <th className="px-4 py-3 font-medium">Oportunidad</th>
            <th className="px-4 py-3 font-medium">Actualizado</th>
            <th className="sticky right-0 bg-surface px-4 py-3 font-medium">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((vehicle) => {
            const title = formatVehicleTitle(vehicle);
            return (
              <tr key={vehicle.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <CoverThumb url={vehicle.cover_url} alt={title} />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{title}</p>
                  {vehicle.stock_code ? (
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Folio {vehicle.stock_code}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {vehicleCategoryLabel[vehicle.category]}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={statusBadgeTone(vehicle.status)}>
                    {vehicleStatusLabel[vehicle.status]}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <FlagBadge
                    active={vehicle.is_published}
                    activeLabel="Sí"
                    inactiveLabel="No"
                  />
                </td>
                <td className="px-4 py-3">
                  <FlagBadge
                    active={vehicle.is_featured}
                    activeLabel="Sí"
                    inactiveLabel="No"
                  />
                </td>
                <td className="px-4 py-3">
                  <FlagBadge
                    active={vehicle.is_weekly_opportunity}
                    activeLabel="Sí"
                    inactiveLabel="No"
                  />
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {formatUpdatedAt(vehicle.updated_at)}
                </td>
                <td className="sticky right-0 bg-paper-elevated px-4 py-3 text-right">
                  <VehicleActionsMenu vehicle={vehicle} />
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

export function VehiclesMobileList({
  items,
}: {
  items: AdminVehicleListItem[];
}) {
  return (
    <ul className="space-y-3 md:hidden">
      {items.map((vehicle) => {
        const title = formatVehicleTitle(vehicle);
        return (
          <li
            key={vehicle.id}
            className="rounded-md border border-line bg-paper-elevated p-4"
          >
            <div className="flex gap-3">
              <CoverThumb url={vehicle.cover_url} alt={title} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{title}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {vehicleCategoryLabel[vehicle.category]}
                  {vehicle.stock_code ? ` · Folio ${vehicle.stock_code}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={statusBadgeTone(vehicle.status)}>
                    {vehicleStatusLabel[vehicle.status]}
                  </StatusBadge>
                  <FlagBadge
                    active={vehicle.is_published}
                    activeLabel="Publicado"
                    inactiveLabel="No publicado"
                  />
                  <FlagBadge
                    active={vehicle.is_weekly_opportunity}
                    activeLabel="Oportunidad"
                    inactiveLabel="Sin oportunidad"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <VehicleActionsMenu vehicle={vehicle} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
