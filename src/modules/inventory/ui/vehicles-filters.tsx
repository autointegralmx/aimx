import type { AdminVehicleListFilters } from "@/modules/inventory/domain/admin-list-filters";
import { buildAdminVehiclesHref } from "@/modules/inventory/domain/admin-list-filters";
import Link from "next/link";

const selectClass =
  "min-h-11 w-full rounded-md border border-line bg-paper-elevated px-3 text-sm text-ink";

export function VehiclesFilters({
  filters,
}: {
  filters: AdminVehicleListFilters;
}) {
  return (
    <form
      method="get"
      action="/admin/vehiculos"
      className="rounded-md border border-line bg-paper-elevated p-4"
      aria-label="Filtros de vehículos"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="block text-sm text-ink">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Buscar
          </span>
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Marca, modelo, versión o folio"
            className={selectClass}
          />
        </label>

        <label className="block text-sm text-ink">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Categoría
          </span>
          <select
            name="category"
            defaultValue={filters.category}
            className={selectClass}
          >
            <option value="all">Todas</option>
            <option value="accidentado">Accidentados</option>
            <option value="recuperado">Recuperados</option>
            <option value="seminuevo">Seminuevos</option>
          </select>
        </label>

        <label className="block text-sm text-ink">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Estado
          </span>
          <select
            name="status"
            defaultValue={filters.status}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="draft">Borrador</option>
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="sold">Vendido</option>
            <option value="archived">Archivado</option>
          </select>
        </label>

        <label className="block text-sm text-ink">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Publicación
          </span>
          <select
            name="published"
            defaultValue={filters.published}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="yes">Publicados</option>
            <option value="no">No publicados</option>
          </select>
        </label>

        <label className="block text-sm text-ink">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Destacado
          </span>
          <select
            name="featured"
            defaultValue={filters.featured}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="yes">Destacados</option>
            <option value="no">No destacados</option>
          </select>
        </label>

        <label className="block text-sm text-ink">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Oportunidad
          </span>
          <select
            name="opportunity"
            defaultValue={filters.opportunity}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="yes">Oportunidades</option>
            <option value="no">No oportunidades</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="btn-dark touch-target">
          Aplicar filtros
        </button>
        <Link
          href={buildAdminVehiclesHref({})}
          className="touch-target inline-flex items-center justify-center border border-line bg-paper-elevated px-4 text-sm font-medium text-ink hover:bg-surface"
        >
          Limpiar filtros
        </Link>
      </div>
    </form>
  );
}
