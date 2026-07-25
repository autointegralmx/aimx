import Link from "next/link";
import Image from "next/image";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { VehicleAvailabilityBadge } from "@/modules/inventory/ui/vehicle-availability-badge";

type Variant = "default" | "onDark";
type Density = "default" | "compact";

/**
 * Desktop: vertical editorial card. Mobile: horizontal row.
 * Status lives only on the photo badge.
 */
export function VehicleCard({
  vehicle,
  coverUrl,
  variant = "default",
  density = "default",
}: {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
  variant?: Variant;
  density?: Density;
}) {
  if (!vehicle.id || !vehicle.slug) return null;

  const vm = buildPublicVehicleViewModel(vehicle);
  const onDark = variant === "onDark";
  const compact = density === "compact";
  const titleClass = onDark ? "text-text-on-dark" : "text-text-primary";
  const bodyClass = onDark ? "text-text-muted-dark" : "text-text-secondary";
  const emptyClass = onDark ? "text-text-muted-dark" : "text-text-secondary";
  const shell = onDark ? "card-editorial-dark" : "card-editorial";
  const mediaBg = onDark ? "bg-[#1a1d22]" : "bg-surface-secondary";
  const spec = [vm.year, vehicle.transmission].filter(Boolean).join(" · ");
  const unoptimized = Boolean(
    coverUrl?.includes("/storage/v1/object/public/"),
  );

  return (
    <article className={`group ${shell}`}>
      <Link href={`/vehiculos/${vm.slug}`} className="block">
        {/* Mobile: row */}
        <div className="flex items-stretch gap-3 p-2 md:hidden">
          <div
            className={`relative h-[96px] w-[112px] shrink-0 overflow-hidden sm:h-[104px] sm:w-[120px] ${mediaBg}`}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={vm.title}
                fill
                loading="lazy"
                sizes="140px"
                className="img-zoom object-cover"
                unoptimized={unoptimized}
              />
            ) : (
              <div
                className={`flex h-full items-center justify-center text-[10px] ${emptyClass}`}
              >
                Sin foto
              </div>
            )}
            <VehicleAvailabilityBadge status={vehicle.status} size="card" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5 pr-1">
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
            {spec ? <p className={`text-[13px] ${bodyClass}`}>{spec}</p> : null}
            <p className={`text-[15px] font-semibold ${titleClass}`}>
              {vm.listPriceLabel ?? "Precio por confirmar"}
            </p>
            <span className="pt-0.5 text-[12px] font-semibold text-brand-red">
              Ver →
            </span>
          </div>
        </div>

        {/* Desktop: vertical card */}
        <div className="hidden md:block">
          <div
            className={`relative overflow-hidden ${mediaBg} ${
              compact ? "aspect-[16/9]" : "aspect-[3/2]"
            }`}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={vm.title}
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="img-zoom object-cover"
                unoptimized={unoptimized}
              />
            ) : (
              <div
                className={`flex h-full items-center justify-center text-xs ${emptyClass}`}
              >
                Sin imagen
              </div>
            )}
            <VehicleAvailabilityBadge status={vehicle.status} size="card" />
          </div>
          <div className={compact ? "space-y-0.5 p-3" : "space-y-1 p-3.5"}>
            {vm.categoryLabel ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-red">
                {vm.categoryLabel}
              </p>
            ) : null}
            <h3
              className={`font-semibold leading-snug tracking-tight ${titleClass} ${
                compact ? "text-[14px]" : "text-[15px]"
              }`}
            >
              {vm.title}
            </h3>
            {spec ? (
              <p className={`${bodyClass} text-xs`}>{spec}</p>
            ) : null}
            {vm.auction.badgeLabel ? (
              <p className="text-xs font-semibold text-brand-red">
                {vm.auction.badgeLabel}
              </p>
            ) : null}
            <div className="flex items-end justify-between gap-3 pt-0.5">
              <p className={`text-sm font-semibold ${titleClass}`}>
                {vm.listPriceLabel ?? "Precio por confirmar"}
              </p>
              <span className="shrink-0 text-sm font-semibold text-brand-red">
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
