import {
  formatVehicleTitle,
  resolveAdminStatusPresentation,
  vehicleCategoryLabel,
} from "@/modules/inventory/domain/vehicle-labels";
import { FlagBadge, StatusBadge } from "@/modules/inventory/ui/status-badge";
import { VehicleActionsMenu } from "@/modules/inventory/ui/vehicle-actions-menu";
import { VehicleCatalogOrderControls } from "@/modules/inventory/ui/vehicle-catalog-order-controls";
import { resolveAuctionPublicState } from "@/modules/inventory/domain/vehicle-auction";
import type { AdminVehicleListItem } from "@/modules/inventory/infrastructure/vehicle-repository";
import Image from "next/image";

function resolveAdminAuction(vehicle: AdminVehicleListItem) {
  return resolveAuctionPublicState({
    is_published: vehicle.is_published,
    is_weekly_opportunity: vehicle.is_weekly_opportunity,
    status: vehicle.status,
    opportunity_deadline: vehicle.opportunity_deadline,
    auction_awarded_amount: vehicle.auction_awarded_amount,
    deleted_at: vehicle.deleted_at,
  });
}

function AdminStatusCell({ vehicle }: { vehicle: AdminVehicleListItem }) {
  const auction = resolveAdminAuction(vehicle);
  const presentation = resolveAdminStatusPresentation({
    status: vehicle.status,
    auction,
  });
  return (
    <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>
  );
}

function AuctionAdminCell({ vehicle }: { vehicle: AdminVehicleListItem }) {
  const auction = resolveAdminAuction(vehicle);

  if (auction.active) {
    return <StatusBadge tone="success">En subasta</StatusBadge>;
  }
  if (auction.closed) {
    return auction.awardedLabel ? (
      <p className="text-xs text-ink">{auction.awardedLabel}</p>
    ) : (
      <p className="text-xs text-ink-muted">Monto pendiente</p>
    );
  }
  if (auction.flagged && auction.missingDeadline) {
    return <StatusBadge tone="warning">Sin fecha</StatusBadge>;
  }
  return <span className="text-ink-muted">—</span>;
}

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

  const unoptimized = url.includes("/storage/v1/object/public/");

  return (
    <div className="relative h-14 w-20 overflow-hidden rounded-sm bg-surface">
      <Image
        src={url}
        alt={alt}
        fill
        sizes="80px"
        className="object-cover"
        unoptimized={unoptimized}
      />
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
  orderMode = "catalog",
}: {
  items: AdminVehicleListItem[];
  orderMode?: "catalog" | "featured";
}) {
  return (
    <div className="hidden rounded-md border border-line bg-paper-elevated md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">
              {orderMode === "featured" ? "Orden portada" : "Orden"}
            </th>
            <th className="px-4 py-3 font-medium">Portada</th>
            <th className="px-4 py-3 font-medium">Vehículo</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Publicado</th>
            <th className="px-4 py-3 font-medium">Destacado</th>
            <th className="px-4 py-3 font-medium">En subasta</th>
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
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs tabular-nums text-ink-muted">
                      #
                      {orderMode === "featured"
                        ? (vehicle.featured_order ?? "—")
                        : vehicle.catalog_order}
                    </span>
                    <VehicleCatalogOrderControls
                      vehicleId={vehicle.id}
                      canMoveUp
                      canMoveDown
                      mode={orderMode}
                    />
                  </div>
                </td>
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
                  <AdminStatusCell vehicle={vehicle} />
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
                  <AuctionAdminCell vehicle={vehicle} />
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
  orderMode = "catalog",
}: {
  items: AdminVehicleListItem[];
  orderMode?: "catalog" | "featured";
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
                  {orderMode === "featured"
                    ? ` · Portada #${vehicle.featured_order ?? "—"}`
                    : ` · Orden #${vehicle.catalog_order}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <AdminStatusCell vehicle={vehicle} />
                  <FlagBadge
                    active={vehicle.is_published}
                    activeLabel="Publicado"
                    inactiveLabel="No publicado"
                  />
                  <AuctionAdminCell vehicle={vehicle} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <VehicleCatalogOrderControls
                vehicleId={vehicle.id}
                canMoveUp
                canMoveDown
                mode={orderMode}
              />
              <VehicleActionsMenu vehicle={vehicle} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
