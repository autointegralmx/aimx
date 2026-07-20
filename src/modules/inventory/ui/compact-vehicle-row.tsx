import Link from "next/link";
import Image from "next/image";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { VehicleAvailabilityBadge } from "@/modules/inventory/ui/vehicle-availability-badge";

type Variant = "default" | "onDark";

/**
 * Dense mobile row (~100–110px). Used when inventory is large on ≤768px.
 * Desktop keeps full cards.
 */
export function CompactVehicleRow({
  vehicle,
  coverUrl,
  variant = "default",
}: {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
  variant?: Variant;
}) {
  if (!vehicle.id || !vehicle.slug) return null;

  const vm = buildPublicVehicleViewModel(vehicle);
  const onDark = variant === "onDark";
  const titleClass = onDark ? "text-text-on-dark" : "text-text-primary";
  const bodyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";
  const unoptimized = Boolean(
    coverUrl?.includes("/storage/v1/object/public/"),
  );

  return (
    <article
      className={`overflow-hidden rounded-md border ${
        onDark
          ? "border-border-dark bg-surface-dark-elevated"
          : "border-border-subtle bg-surface-primary"
      }`}
    >
      <Link
        href={`/vehiculos/${vm.slug}`}
        className="flex min-h-[100px] items-stretch gap-3 p-2.5"
      >
        <div
          className={`relative h-[75px] w-[100px] shrink-0 overflow-hidden rounded-sm ${
            onDark ? "bg-[#1a1d22]" : "bg-surface-secondary"
          }`}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={vm.title}
              fill
              loading="lazy"
              sizes="100px"
              className="object-cover"
              unoptimized={unoptimized}
            />
          ) : (
            <div
              className={`flex h-full items-center justify-center text-[10px] uppercase ${bodyClass}`}
            >
              Sin foto
            </div>
          )}
          <VehicleAvailabilityBadge status={vehicle.status} size="card" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
          {vm.categoryLabel ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-red">
              {vm.categoryLabel}
            </p>
          ) : null}
          <h3
            className={`line-clamp-2 text-[15px] font-bold uppercase leading-snug tracking-wide ${titleClass}`}
          >
            {vm.title}
          </h3>
          <p className={`text-[13px] ${bodyClass}`}>
            {[vm.year, vehicle.transmission].filter(Boolean).join(" · ")}
          </p>
          <p className={`text-[15px] font-semibold ${titleClass}`}>
            {vm.listPriceLabel ?? "Precio por confirmar"}
          </p>
        </div>
      </Link>
    </article>
  );
}
