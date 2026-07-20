import Link from "next/link";
import type { AdminVehicleListFilters } from "@/modules/inventory/domain/admin-list-filters";
import {
  ADMIN_QUICK_CHANNELS,
  buildAdminQuickChannelHref,
  resolveAdminQuickChannel,
} from "@/modules/inventory/domain/admin-list-filters";

export function VehiclesAdminChannelChips({
  filters,
}: {
  filters: AdminVehicleListFilters;
}) {
  const active = resolveAdminQuickChannel(filters);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Acceso rápido
      </p>
      <nav
        aria-label="Categorías y canal"
        className="flex flex-wrap gap-2"
      >
        {ADMIN_QUICK_CHANNELS.map((channel) => {
          const isActive = channel.id === active;
          return (
            <Link
              key={channel.id}
              href={buildAdminQuickChannelHref(filters, channel.id)}
              className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-brand-black bg-brand-black text-white"
                  : "border-line bg-paper-elevated text-ink hover:border-brand-black"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {channel.label}
            </Link>
          );
        })}
      </nav>
      <p className="text-xs text-ink-muted">
        Usa ↑ ↓ en la lista para definir el orden en el sitio (menor número =
        aparece primero).
      </p>
    </div>
  );
}
