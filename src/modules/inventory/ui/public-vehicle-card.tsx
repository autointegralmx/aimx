import Link from "next/link";
import { formatPublicPrice } from "@/modules/inventory/domain/vehicle-display";
import { vehicleCategoryLabel } from "@/modules/inventory/domain/vehicle-labels";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";

type Variant = "default" | "onDark";

export function VehicleCard({
  vehicle,
  coverUrl,
  variant = "default",
}: {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
  variant?: Variant;
}) {
  if (!vehicle.id || !vehicle.slug) return null;

  const title =
    vehicle.public_title?.trim() ||
    [vehicle.year, vehicle.make, vehicle.model, vehicle.version]
      .filter(Boolean)
      .join(" ");
  const price = formatPublicPrice({
    price_amount: vehicle.price_amount,
    price_label: vehicle.price_label,
    currency: vehicle.currency,
  });
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
              alt={title}
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
            {title}
          </h3>
          {vehicle.year || vehicle.make || vehicle.model ? (
            <p className={`text-sm ${bodyClass}`}>
              {[vehicle.year, vehicle.make, vehicle.model]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {vehicle.short_description ? (
            <p className={`line-clamp-2 text-sm ${bodyClass}`}>
              {vehicle.short_description}
            </p>
          ) : null}
          {price ? (
            <p className={`pt-1 text-sm font-semibold ${titleClass}`}>{price}</p>
          ) : null}
          <span className="inline-flex pt-2 text-sm font-semibold uppercase tracking-wide text-brand-red">
            Ver ficha →
          </span>
        </div>
      </Link>
    </article>
  );
}
