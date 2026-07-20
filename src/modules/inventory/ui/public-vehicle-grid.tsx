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
 * Mobile density: cards by default; compact rows when inventory is large.
 * Desktop (≥md) always uses full cards.
 */
export function PublicVehicleGrid({
  items,
  variant = "default",
  mode = "inventory",
  className = "",
}: {
  items: Item[];
  variant?: "default" | "onDark";
  mode?: "inventory" | "auction";
  className?: string;
}) {
  const useCompactMobile = items.length > COMPACT_THRESHOLD;

  return (
    <div className={className}>
      {useCompactMobile ? (
        <div className="grid gap-2 md:hidden">
          {items.map(({ vehicle, coverUrl }) => (
            <CompactVehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
              variant={variant}
            />
          ))}
        </div>
      ) : null}

      <div
        className={
          useCompactMobile
            ? "hidden gap-8 md:grid md:grid-cols-2 lg:grid-cols-3"
            : "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
        }
      >
        {items.map(({ vehicle, coverUrl }) =>
          mode === "auction" ? (
            <AuctionVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
              variant={variant}
            />
          ) : (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
              variant={variant}
            />
          ),
        )}
      </div>
    </div>
  );
}
