import Link from "next/link";
import {
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  formatPublicPrice,
} from "@/modules/inventory/domain/vehicle-display";
import { vehicleCategoryLabel } from "@/modules/inventory/domain/vehicle-labels";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  buildSiteWhatsAppUrl,
  buildVehicleWhatsAppMessage,
} from "@/modules/leads/domain/whatsapp";
import { getSiteOrigin } from "@/shared/config/site";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";

type Props = {
  vehicle: PublicVehicle;
  images: VehicleMediaItem[];
  preview?: boolean;
};

export function PublicVehicleDetail({
  vehicle,
  images,
  preview = false,
}: Props) {
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
  const pageUrl = `${getSiteOrigin()}/vehiculos/${vehicle.slug}`;
  const whatsappUrl = buildSiteWhatsAppUrl(
    buildVehicleWhatsAppMessage({
      year: vehicle.year ?? "",
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      version: vehicle.version,
      pageUrl: preview ? undefined : pageUrl,
    }),
  );
  const cover = images.find((item) => item.is_cover) ?? images[0];
  const description =
    vehicle.full_description?.trim() ||
    vehicle.short_description?.trim() ||
    "";

  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      {!preview ? <SiteHeader /> : null}
      <main className="container-site py-10 md:py-14">
        {preview ? (
          <p className="mb-6 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
            Vista previa protegida — este vehículo no cambia su estado público.
          </p>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover.url}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                  Sin imagen
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <ul className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-6">
                {images.map((image) => (
                  <li
                    key={image.media_asset_id}
                    className="aspect-square overflow-hidden bg-surface-secondary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.alt_text || title}
                      className="h-full w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            {vehicle.category ? (
              <p className="label-eyebrow">
                {vehicleCategoryLabel[vehicle.category]}
              </p>
            ) : null}
            <h1 className="mt-3 text-h3 text-text-primary">{title}</h1>
            {price ? (
              <p className="mt-4 text-xl font-semibold text-text-primary">
                {price}
              </p>
            ) : null}

            <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
              {vehicle.year ? (
                <div>
                  <dt className="text-text-secondary">Año</dt>
                  <dd className="font-medium">{vehicle.year}</dd>
                </div>
              ) : null}
              {vehicle.mileage_km != null ? (
                <div>
                  <dt className="text-text-secondary">Kilometraje</dt>
                  <dd className="font-medium">
                    {vehicle.mileage_km.toLocaleString("es-MX")} km
                  </dd>
                </div>
              ) : null}
              {vehicle.transmission ? (
                <div>
                  <dt className="text-text-secondary">Transmisión</dt>
                  <dd className="font-medium">{vehicle.transmission}</dd>
                </div>
              ) : null}
              {vehicle.fuel_type ? (
                <div>
                  <dt className="text-text-secondary">Combustible</dt>
                  <dd className="font-medium">{vehicle.fuel_type}</dd>
                </div>
              ) : null}
              {vehicle.exterior_color ? (
                <div>
                  <dt className="text-text-secondary">Color</dt>
                  <dd className="font-medium">{vehicle.exterior_color}</dd>
                </div>
              ) : null}
              {vehicle.version ? (
                <div>
                  <dt className="text-text-secondary">Versión</dt>
                  <dd className="font-medium">{vehicle.version}</dd>
                </div>
              ) : null}
            </dl>

            {vehicle.public_tags && vehicle.public_tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {vehicle.public_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-border-subtle px-2 py-1 text-xs uppercase tracking-wide text-text-secondary"
                  >
                    {tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-8 inline-flex w-full sm:w-auto"
              data-testid="vehicle-whatsapp-cta"
            >
              Quiero más información
            </a>

            {!preview ? (
              <Link
                href="/vehiculos"
                className="mt-4 inline-flex text-sm text-text-secondary hover:text-text-primary"
              >
                ← Volver a vehículos
              </Link>
            ) : null}
          </div>
        </div>

        {description ? (
          <section className="mt-12 max-w-3xl">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Descripción
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-text-secondary">
              {description}
            </p>
          </section>
        ) : null}

        {vehicle.damage_summary ||
        (vehicle.damage_tags && vehicle.damage_tags.length > 0) ||
        vehicle.condition_notes ? (
          <section className="mt-12 max-w-3xl">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Condición
            </h2>
            {vehicle.damage_summary ? (
              <p className="mt-4 text-text-secondary">{vehicle.damage_summary}</p>
            ) : null}
            {vehicle.condition_notes ? (
              <p className="mt-3 text-text-secondary">
                {vehicle.condition_notes}
              </p>
            ) : null}
            {vehicle.damage_tags && vehicle.damage_tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {vehicle.damage_tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-sm bg-surface-secondary px-2 py-1 text-xs uppercase tracking-wide"
                  >
                    {tag.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </main>
      {!preview ? <SiteFooter /> : null}
    </div>
  );
}

export function publicVehicleMetadata(vehicle: PublicVehicle) {
  const title =
    vehicle.seo_title?.trim() ||
    buildDefaultSeoTitle({
      year: vehicle.year ?? 0,
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      category: vehicle.category ?? "vehículo",
    });
  const description =
    vehicle.seo_description?.trim() ||
    buildDefaultSeoDescription({
      short_description: vehicle.short_description,
      year: vehicle.year ?? 0,
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
    });
  return { title, description };
}
