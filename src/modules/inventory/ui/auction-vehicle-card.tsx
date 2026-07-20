import Link from "next/link";
import Image from "next/image";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { VehicleAvailabilityBadge, VehicleSoldStatusChip } from "@/modules/inventory/ui/vehicle-availability-badge";

type Variant = "default" | "onDark";

export function AuctionVehicleCard({
  vehicle,
  coverUrl,
  variant = "default",
  now,
}: {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
  variant?: Variant;
  now?: Date;
}) {
  if (!vehicle.id || !vehicle.slug) return null;

  const vm = buildPublicVehicleViewModel(vehicle, { now });
  if (!vm.auction.includeInAuctionBoard) return null;

  const onDark = variant === "onDark";
  const titleClass = onDark ? "text-text-on-dark" : "text-text-primary";
  const bodyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";
  const emptyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";
  const spec = [vm.year, vehicle.transmission]
    .filter(Boolean)
    .join(" · ");
  const unoptimized = Boolean(
    coverUrl?.includes("/storage/v1/object/public/"),
  );

  return (
    <article
      className={`group overflow-hidden rounded-[12px] border ${
        onDark
          ? "border-border-dark bg-surface-dark-elevated"
          : "border-border-subtle bg-surface-primary shadow-card"
      }`}
    >
      <Link href={`/vehiculos/${vm.slug}`} className="block">
        <div
          className={`relative aspect-[4/3] overflow-hidden ${
            onDark ? "bg-[#1a1d22]" : "bg-surface-secondary"
          }`}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={vm.title}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
          <VehicleAvailabilityBadge status={vehicle.status} size="card" />
        </div>
        <div className="space-y-2 p-5">
          {vm.categoryLabel ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
              {vm.categoryLabel}
            </p>
          ) : null}
          <h3
            className={`text-lg font-bold uppercase tracking-wide ${titleClass}`}
          >
            {vm.title}
          </h3>
          {spec ? <p className={`text-sm ${bodyClass}`}>{spec}</p> : null}
          <p className={`text-sm font-semibold ${titleClass}`}>
            {vm.listPriceLabel ?? "Precio por confirmar"}
          </p>
          <VehicleSoldStatusChip status={vehicle.status} />
          {vm.auction.badgeLabel ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-red">
              {vm.auction.badgeLabel}
            </p>
          ) : null}
          {vm.auction.closesLabel ? (
            <p className={`text-sm ${bodyClass}`}>{vm.auction.closesLabel}</p>
          ) : null}
          <span className="inline-flex pt-2 text-sm font-semibold uppercase tracking-wide text-brand-red">
            Ver vehículo →
          </span>
        </div>
      </Link>
    </article>
  );
}
