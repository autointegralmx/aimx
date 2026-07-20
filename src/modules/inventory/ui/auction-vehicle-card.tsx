import Link from "next/link";
import {
  buildPublicHeadline,
  formatPublicPrice,
} from "@/modules/inventory/domain/vehicle-display";
import {
  formatAuctionClosesLabel,
  isPublicAuctionVehicle,
} from "@/modules/inventory/domain/vehicle-auction";
import { vehicleCategoryLabel } from "@/modules/inventory/domain/vehicle-labels";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";

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

  const active = isPublicAuctionVehicle(
    {
      is_published: true,
      is_weekly_opportunity: vehicle.is_weekly_opportunity,
      status: vehicle.status,
      opportunity_deadline: vehicle.opportunity_deadline,
    },
    now,
  );
  if (!active) return null;

  const headline = buildPublicHeadline({
    make: vehicle.make,
    model: vehicle.model,
    public_title: vehicle.public_title,
  });
  const price = formatPublicPrice({
    price_amount: vehicle.price_amount,
    price_label: vehicle.price_label,
    currency: vehicle.currency,
  });
  const spec = [vehicle.year, vehicle.transmission]
    .filter(Boolean)
    .join(" · ");
  const closes = vehicle.opportunity_deadline
    ? formatAuctionClosesLabel(vehicle.opportunity_deadline, now)
    : null;

  const onDark = variant === "onDark";
  const titleClass = onDark ? "text-text-on-dark" : "text-text-primary";
  const bodyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";
  const emptyClass = onDark ? "text-[#E4E6EA]" : "text-text-secondary";

  return (
    <article
      className={`group overflow-hidden rounded-[12px] border ${
        onDark
          ? "border-border-dark bg-surface-dark-elevated"
          : "border-border-subtle bg-surface-primary shadow-card"
      }`}
    >
      <Link href={`/vehiculos/${vehicle.slug}`} className="block">
        <div
          className={`aspect-[4/3] overflow-hidden ${
            onDark ? "bg-[#1a1d22]" : "bg-surface-secondary"
          }`}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={headline}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className={`flex h-full items-center justify-center text-xs uppercase tracking-wide ${emptyClass}`}
            >
              Sin imagen
            </div>
          )}
        </div>
        <div className="space-y-2 p-5">
          {vehicle.category ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
              {vehicleCategoryLabel[vehicle.category]}
            </p>
          ) : null}
          <h3
            className={`text-lg font-bold uppercase tracking-wide ${titleClass}`}
          >
            {headline}
          </h3>
          {spec ? <p className={`text-sm ${bodyClass}`}>{spec}</p> : null}
          {price ? (
            <p className={`text-sm font-semibold ${titleClass}`}>{price}</p>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-red">
            En subasta
          </p>
          {closes ? (
            <p className={`text-sm ${bodyClass}`}>{closes}</p>
          ) : null}
          <span className="inline-flex pt-2 text-sm font-semibold uppercase tracking-wide text-brand-red">
            Ver vehículo →
          </span>
        </div>
      </Link>
    </article>
  );
}
