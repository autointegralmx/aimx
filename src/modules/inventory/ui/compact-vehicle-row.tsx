import Link from "next/link";
import Image from "next/image";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { VehicleAvailabilityBadge } from "@/modules/inventory/ui/vehicle-availability-badge";

type Variant = "default" | "onDark";

/**
 * Dense mobile row. Used when inventory is large on ≤768px.
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
  const bodyClass = onDark ? "text-text-muted-dark" : "text-text-secondary";
  const unoptimized = Boolean(
    coverUrl?.includes("/storage/v1/object/public/"),
  );

  return (
    <article className={onDark ? "card-editorial-dark" : "card-editorial"}>
      <Link
        href={`/vehiculos/${vm.slug}`}
        className="flex min-h-[96px] items-stretch gap-3 p-2"
      >
        <div
          className={`relative h-[80px] w-[104px] shrink-0 overflow-hidden ${
            onDark ? "bg-[#1a1d22]" : "bg-surface-secondary"
          }`}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={vm.title}
              fill
              loading="lazy"
              sizes="120px"
              className="object-cover"
              unoptimized={unoptimized}
            />
          ) : (
            <div
              className={`flex h-full items-center justify-center text-[10px] ${bodyClass}`}
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
            className={`line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight ${titleClass}`}
          >
            {vm.title}
          </h3>
          <p className={`text-[13px] ${bodyClass}`}>
            {[vm.year, vehicle.transmission].filter(Boolean).join(" · ")}
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className={`text-[15px] font-semibold ${titleClass}`}>
              {vm.listPriceLabel ?? "Precio por confirmar"}
            </p>
            <span className="text-sm font-semibold text-brand-red" aria-hidden>
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
