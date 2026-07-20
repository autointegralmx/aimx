import Link from "next/link";
import {
  buildAdminVehiclesHref,
  type AdminVehicleListFilters,
} from "@/modules/inventory/domain/admin-list-filters";

export function VehiclesEmptyState({
  kind,
}: {
  kind: "empty" | "filtered" | "error";
}) {
  if (kind === "error") {
    return (
      <div className="rounded-md border border-line bg-paper-elevated px-6 py-12 text-center">
        <p className="text-base font-medium text-ink">
          No pudimos cargar los vehículos.
        </p>
        <Link
          href="/admin/vehiculos"
          className="btn-dark touch-target mt-6 inline-flex"
        >
          Reintentar
        </Link>
      </div>
    );
  }

  if (kind === "filtered") {
    return (
      <div className="rounded-md border border-line bg-paper-elevated px-6 py-12 text-center">
        <p className="text-base font-medium text-ink">
          No encontramos vehículos con estos filtros.
        </p>
        <Link
          href={buildAdminVehiclesHref({})}
          className="btn-secondary touch-target mt-6 inline-flex"
        >
          Limpiar filtros
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line bg-paper-elevated px-6 py-12 text-center">
      <p className="text-base font-medium text-ink">
        No hay vehículos registrados todavía.
      </p>
      <Link
        href="/admin/vehiculos/nuevo"
        className="btn-dark touch-target mt-6 inline-flex"
      >
        Nuevo vehículo
      </Link>
    </div>
  );
}

export function VehiclesPagination({
  filters,
  total,
  page,
  pageCount,
}: {
  filters: AdminVehicleListFilters;
  total: number;
  page: number;
  pageCount: number;
}) {
  const prevHref =
    page > 1
      ? buildAdminVehiclesHref({ ...filters, page: page - 1 })
      : null;
  const nextHref =
    page < pageCount
      ? buildAdminVehiclesHref({ ...filters, page: page + 1 })
      : null;

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-muted">
        {total} resultado{total === 1 ? "" : "s"} · Página {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="touch-target inline-flex items-center justify-center border border-line bg-paper-elevated px-4 text-sm font-medium text-ink hover:bg-surface"
          >
            Anterior
          </Link>
        ) : (
          <span className="touch-target inline-flex items-center justify-center border border-line px-4 text-sm text-ink-subtle opacity-50">
            Anterior
          </span>
        )}
        {nextHref ? (
          <Link
            href={nextHref}
            className="touch-target inline-flex items-center justify-center border border-line bg-paper-elevated px-4 text-sm font-medium text-ink hover:bg-surface"
          >
            Siguiente
          </Link>
        ) : (
          <span className="touch-target inline-flex items-center justify-center border border-line px-4 text-sm text-ink-subtle opacity-50">
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
