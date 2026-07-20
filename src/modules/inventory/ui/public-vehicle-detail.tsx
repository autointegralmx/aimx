import Link from "next/link";
import {
  briefConditionNote,
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  buildInfoFacts,
  buildObjectiveBadges,
  buildPublicHeadline,
  buildPublicSpecCards,
  buildPublicSpecLine,
  formatDamageTagLabel,
  formatDetailPrice,
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
import { PublicVehicleGallery } from "@/modules/inventory/ui/public-vehicle-gallery";
import { PublicVehicleInfoCard } from "@/modules/inventory/ui/public-vehicle-info-card";

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
  const headline = buildPublicHeadline({
    make: vehicle.make,
    model: vehicle.model,
    public_title: vehicle.public_title,
  });
  const price = formatDetailPrice({
    price_amount: vehicle.price_amount,
    price_label: vehicle.price_label,
    currency: vehicle.currency,
  });
  const specLine = buildPublicSpecLine({
    year: vehicle.year,
    transmission: vehicle.transmission,
    body_type: vehicle.body_type,
    fuel_type: vehicle.fuel_type,
  });
  const specCards = buildPublicSpecCards({
    year: vehicle.year,
    mileage_km: vehicle.mileage_km,
    transmission: vehicle.transmission,
    fuel_type: vehicle.fuel_type,
    exterior_color: vehicle.exterior_color,
    body_type: vehicle.body_type,
    version: vehicle.version,
    status: vehicle.status,
  });
  const badges = buildObjectiveBadges({
    category: vehicle.category,
    transmission: vehicle.transmission,
    fuel_type: vehicle.fuel_type,
    body_type: vehicle.body_type,
    status: vehicle.status,
  });
  const infoFacts = buildInfoFacts({
    category: vehicle.category,
    status: vehicle.status,
  });
  const customNote =
    vehicle.short_description?.trim() ||
    vehicle.full_description?.trim() ||
    null;
  const damageTags = (vehicle.damage_tags ?? []).filter(Boolean);
  const conditionNote = briefConditionNote({
    damage_summary: vehicle.damage_summary,
    condition_notes: vehicle.condition_notes,
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

  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      {!preview ? <SiteHeader /> : null}
      <main className="container-site py-6 md:py-10">
        {preview ? (
          <p className="mb-5 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
            Vista previa protegida — este vehículo no cambia su estado público.
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)] lg:gap-10 lg:items-start">
          <PublicVehicleGallery images={images} alt={headline} />

          <aside className="space-y-5 lg:sticky lg:top-24">
            {vehicle.category ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
                {vehicleCategoryLabel[vehicle.category]}
              </p>
            ) : null}

            <div>
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-text-primary sm:text-[2rem]">
                {headline}
              </h1>
              {specLine.length > 0 ? (
                <p className="mt-2 text-sm text-text-secondary sm:text-[15px]">
                  {specLine.join(" · ")}
                </p>
              ) : null}
            </div>

            <p className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {price}
            </p>

            {badges.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Características">
                {badges.map((badge) => (
                  <li
                    key={badge}
                    className="border border-border-subtle bg-surface-primary px-2.5 py-1 text-xs font-medium text-text-primary"
                  >
                    {badge}
                  </li>
                ))}
              </ul>
            ) : null}

            {specCards.length > 0 ? (
              <ul
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                aria-label="Datos principales"
              >
                {specCards.map((card) => (
                  <li
                    key={`${card.label}-${card.value}`}
                    className="border border-border-subtle bg-surface-primary px-3 py-3"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                      {card.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {card.value}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {infoFacts.length > 0 || customNote ? (
              <PublicVehicleInfoCard
                facts={infoFacts}
                customNote={customNote}
              />
            ) : null}

            {damageTags.length > 0 || conditionNote ? (
              <section aria-labelledby="vehicle-damage-heading">
                <h2
                  id="vehicle-damage-heading"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary"
                >
                  Daños registrados
                </h2>
                {damageTags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {damageTags.map((tag) => (
                      <li
                        key={tag}
                        className="bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-primary"
                      >
                        {formatDamageTagLabel(tag)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {conditionNote ? (
                  <p className="mt-3 line-clamp-2 text-sm text-text-secondary">
                    {conditionNote}
                  </p>
                ) : null}
              </section>
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex w-full justify-center"
              data-testid="vehicle-whatsapp-cta"
            >
              Quiero más información
            </a>

            {!preview ? (
              <Link
                href="/vehiculos"
                className="inline-flex text-sm text-text-secondary hover:text-text-primary"
              >
                ← Volver a vehículos
              </Link>
            ) : null}
          </aside>
        </div>
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
      category: vehicle.category,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuel_type,
      status: vehicle.status,
      damage_tags: vehicle.damage_tags,
    });
  return { title, description };
}
