import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { VehicleCard } from "@/modules/inventory/ui/public-vehicle-card";
import { AuctionVehicleCard } from "@/modules/inventory/ui/auction-vehicle-card";
import { CompactVehicleRow } from "@/modules/inventory/ui/compact-vehicle-row";

const COMPACT_THRESHOLD = 20;

type Item = {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
};

/**
 * Grid uniforme de vehículos. Mobile: cards o filas compactas si hay muchos.
 */
export function PublicVehicleGrid({
  items,
  variant = "default",
  mode = "inventory",
  listMode = "all",
  limit,
  density = "default",
  className = "",
}: {
  items: Item[];
  variant?: "default" | "onDark";
  mode?: "inventory" | "auction";
  listMode?: "all" | "preview";
  /** Solo aplica con `listMode="preview"`. */
  limit?: number;
  density?: "default" | "compact";
  className?: string;
}) {
  const visibleItems =
    listMode === "preview" && typeof limit === "number" && limit > 0
      ? items.slice(0, limit)
      : items;

  const useCompactMobile = visibleItems.length > COMPACT_THRESHOLD;
  const compact = density === "compact";

  const desktopGrid = useCompactMobile
    ? "hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : compact
      ? "grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={className}>
      {useCompactMobile ? (
        <div className="grid gap-2 md:hidden">
          {visibleItems.map(({ vehicle, coverUrl }) => (
            <CompactVehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
              variant={variant}
            />
          ))}
        </div>
      ) : null}

      <div className={desktopGrid}>
        {visibleItems.map(({ vehicle, coverUrl }) =>
          mode === "auction" ? (
            <AuctionVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
              variant={variant}
              density={density}
            />
          ) : (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
              variant={variant}
              density={density}
            />
          ),
        )}
      </div>
    </div>
  );
}
