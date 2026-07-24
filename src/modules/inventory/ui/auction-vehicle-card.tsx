import Link from "next/link";
import Image from "next/image";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { VehicleAvailabilityBadge } from "@/modules/inventory/ui/vehicle-availability-badge";

type Variant = "default" | "onDark";
type Density = "default" | "compact";

export function AuctionVehicleCard({
  vehicle,
  coverUrl,
  variant = "default",
  density = "default",
  now,
}: {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
  variant?: Variant;
  density?: Density;
  now?: Date;
}) {
  if (!vehicle.id || !vehicle.slug) return null;

  const vm = buildPublicVehicleViewModel(vehicle, { now });
  if (!vm.auction.includeInAuctionBoard) return null;

  const closed = vm.auction.closed;
  const onDark = variant === "onDark";
  const compact = density === "compact";
  const titleClass = onDark ? "text-text-on-dark" : "text-text-primary";
  const bodyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";
  const emptyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";
  const shell = onDark
    ? "border-border-dark bg-surface-dark-elevated"
    : "border-border-subtle bg-surface-primary shadow-sm md:shadow-card";
  const mediaBg = onDark ? "bg-[#1a1d22]" : "bg-surface-secondary";
  const spec = [vm.year, vehicle.transmission].filter(Boolean).join(" · ");
  const unoptimized = Boolean(
    coverUrl?.includes("/storage/v1/object/public/"),
  );
  const linkLabel = closed ? "Ver resultado →" : "Ver vehículo →";

  return (
    <article
      className={`group overflow-hidden rounded-[10px] border md:rounded-[12px] ${shell}`}
    >
      <Link href={`/vehiculos/${vm.slug}`} className="block">
        {/* Mobile: compact row */}
        <div className="flex items-stretch gap-3 p-2.5 md:hidden">
          <div
            className={`relative h-[82px] w-[110px] shrink-0 overflow-hidden rounded-sm ${mediaBg}`}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={vm.title}
                fill
                loading="lazy"
                sizes="110px"
                className="object-cover"
                unoptimized={unoptimized}
              />
            ) : (
              <div
                className={`flex h-full items-center justify-center text-[10px] uppercase ${emptyClass}`}
              >
                Sin foto
              </div>
            )}
            {closed ? (
              <span className="absolute left-1.5 top-1.5 bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                Subasta cerrada
              </span>
            ) : (
              <VehicleAvailabilityBadge status={vehicle.status} size="card" />
            )}
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
            {spec ? <p className={`text-[13px] ${bodyClass}`}>{spec}</p> : null}
            {closed ? (
              <>
                {vm.auction.closedLabel ? (
                  <p className={`text-[12px] ${bodyClass}`}>
                    {vm.auction.closedLabel}
                  </p>
                ) : null}
                {vm.auction.awardedLabel ? (
                  <p className={`text-[13px] font-semibold ${titleClass}`}>
                    {vm.auction.awardedLabel}
                  </p>
                ) : (
                  <p className={`text-[12px] ${bodyClass}`}>
                    Resultado pendiente de publicación
                  </p>
                )}
              </>
            ) : (
              <>
                <p className={`text-[15px] font-semibold ${titleClass}`}>
                  {vm.listPriceLabel ?? "Precio por confirmar"}
                </p>
                {vm.auction.closesLabel ? (
                  <p className={`text-[12px] ${bodyClass}`}>
                    {vm.auction.closesLabel}
                  </p>
                ) : null}
              </>
            )}
            {vm.locationLabel ? (
              <p className={`text-[12px] font-medium ${titleClass}`}>
                {vm.locationLabel}
              </p>
            ) : null}
            <span className="pt-0.5 text-[12px] font-semibold uppercase tracking-wide text-brand-red">
              {linkLabel}
            </span>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div
            className={`relative overflow-hidden ${mediaBg} ${
              compact ? "aspect-[16/11]" : "aspect-[4/3]"
            }`}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={vm.title}
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                unoptimized={unoptimized}
              />
            ) : (
              <div
                className={`flex h-full items-center justify-center text-xs uppercase tracking-wide ${emptyClass}`}
              >
                Sin imagen
              </div>
            )}
            {closed ? (
              <span className="absolute left-3 top-3 bg-black/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                Subasta cerrada
              </span>
            ) : (
              <VehicleAvailabilityBadge status={vehicle.status} size="card" />
            )}
          </div>
          <div className={compact ? "space-y-1 p-3.5" : "space-y-2 p-5"}>
            {vm.categoryLabel ? (
              <p
                className={`font-semibold uppercase text-brand-red ${
                  compact
                    ? "text-[10px] tracking-[0.14em]"
                    : "text-xs tracking-[0.16em]"
                }`}
              >
                {vm.categoryLabel}
              </p>
            ) : null}
            <h3
              className={`font-bold uppercase tracking-wide ${titleClass} ${
                compact ? "text-[15px] leading-snug" : "text-lg"
              }`}
            >
              {vm.title}
            </h3>
            {spec ? (
              <p className={`${bodyClass} ${compact ? "text-xs" : "text-sm"}`}>
                {spec}
              </p>
            ) : null}
            {closed ? (
              <>
                {vm.auction.badgeLabel ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    {vm.auction.badgeLabel}
                  </p>
                ) : null}
                {vm.auction.closedLabel ? (
                  <p
                    className={`${bodyClass} ${compact ? "text-xs" : "text-sm"}`}
                  >
                    {vm.auction.closedLabel}
                  </p>
                ) : null}
                {vm.auction.awardedLabel ? (
                  <p
                    className={`font-semibold ${titleClass} ${
                      compact ? "text-sm" : "text-sm"
                    }`}
                  >
                    {vm.auction.awardedLabel}
                  </p>
                ) : (
                  <p
                    className={`${bodyClass} ${compact ? "text-xs" : "text-sm"}`}
                  >
                    Resultado pendiente de publicación
                  </p>
                )}
              </>
            ) : (
              <>
                <p
                  className={`font-semibold ${titleClass} ${
                    compact ? "text-sm" : "text-sm"
                  }`}
                >
                  {vm.listPriceLabel ?? "Precio por confirmar"}
                </p>
                {vm.auction.badgeLabel ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-red">
                    {vm.auction.badgeLabel}
                  </p>
                ) : null}
                {vm.auction.closesLabel ? (
                  <p
                    className={`${bodyClass} ${compact ? "text-xs" : "text-sm"}`}
                  >
                    {vm.auction.closesLabel}
                  </p>
                ) : null}
              </>
            )}
            {vm.locationLabel ? (
              <p
                className={`font-medium ${titleClass} ${
                  compact ? "text-xs" : "text-sm"
                }`}
              >
                Ubicación: {vm.locationLabel}
              </p>
            ) : null}
            <span
              className={`inline-flex font-semibold uppercase tracking-wide text-brand-red ${
                compact ? "pt-1 text-xs" : "pt-2 text-sm"
              }`}
            >
              {linkLabel}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
