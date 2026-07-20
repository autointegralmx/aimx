import Link from "next/link";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  buildAuctionVehicleWhatsAppMessage,
  buildSiteWhatsAppUrl,
  buildVehicleWhatsAppMessage,
} from "@/modules/leads/domain/whatsapp";
import { getSiteOrigin } from "@/shared/config/site";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";
import { PublicVehicleGallery } from "@/modules/inventory/ui/public-vehicle-gallery";
import { PublicVehicleInfoCard } from "@/modules/inventory/ui/public-vehicle-info-card";
import { VehicleSoldStatusChip } from "@/modules/inventory/ui/vehicle-availability-badge";

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
  const vm = buildPublicVehicleViewModel(vehicle);
  const pageUrl = `${getSiteOrigin()}/vehiculos/${vm.slug}`;
  const whatsappUrl = buildSiteWhatsAppUrl(
    vm.auction.active
      ? buildAuctionVehicleWhatsAppMessage({
          year: vm.year ?? "",
          make: vm.make ?? "",
          model: vm.model ?? "",
          version: vm.version,
          pageUrl: preview ? undefined : pageUrl,
        })
      : buildVehicleWhatsAppMessage({
          year: vm.year ?? "",
          make: vm.make ?? "",
          model: vm.model ?? "",
          version: vm.version,
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
          <PublicVehicleGallery
            images={images}
            alt={vm.title}
            status={vehicle.status}
          />

          <aside className="space-y-5 lg:sticky lg:top-24">
            {!preview && vm.breadcrumbs.length > 0 ? (
              <nav aria-label="Ruta" className="text-xs text-text-secondary">
                <ol className="flex flex-wrap items-center gap-1.5">
                  {vm.breadcrumbs.map((crumb, index) => {
                    const isLast = index === vm.breadcrumbs.length - 1;
                    return (
                      <li key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
                        {index > 0 ? (
                          <span aria-hidden className="text-text-secondary/60">
                            /
                          </span>
                        ) : null}
                        {isLast || crumb.href === "#" ? (
                          <span className="font-medium text-text-primary">
                            {crumb.label}
                          </span>
                        ) : (
                          <Link
                            href={crumb.href}
                            className="hover:text-text-primary"
                          >
                            {crumb.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : null}

            {vm.categoryLabel ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
                {vm.categoryLabel}
              </p>
            ) : null}

            <div>
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-text-primary sm:text-[2rem]">
                {vm.title}
              </h1>
              {vm.summaryItems.length > 0 ? (
                <p className="mt-2 text-sm text-text-secondary sm:text-[15px]">
                  {vm.summaryItems.join(" · ")}
                </p>
              ) : null}
            </div>

            <p className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {vm.priceLabel}
            </p>

            <VehicleSoldStatusChip status={vehicle.status} />

            {vm.auction.active ? (
              <div className="border border-border-subtle bg-surface-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-red">
                  {vm.auction.badgeLabel}
                </p>
                {vm.auction.closesLong ? (
                  <p className="mt-1 text-sm text-text-secondary">
                    Cierra: {vm.auction.closesLong}
                  </p>
                ) : null}
                {vm.locationLabel ? (
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    Ubicación: {vm.locationLabel}
                  </p>
                ) : null}
              </div>
            ) : null}

            {!vm.auction.active && vm.auction.ended ? (
              <p className="text-sm font-medium text-text-secondary">
                Subasta finalizada
              </p>
            ) : null}

            {vm.operationalBadges.length > 0 ||
            vm.documentationBadges.length > 0 ||
            vm.infoFacts.length > 0 ? (
              <ul
                className="flex flex-wrap gap-2"
                aria-label="Características del vehículo"
              >
                {[
                  ...vm.operationalBadges,
                  ...vm.documentationBadges,
                  ...vm.infoFacts,
                ].map((badge) => (
                  <li
                    key={badge}
                    className="border border-border-subtle bg-surface-primary px-2.5 py-1 text-xs font-medium text-text-primary"
                  >
                    {badge}
                  </li>
                ))}
              </ul>
            ) : null}

            {vm.specCards.length > 0 ? (
              <ul
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                aria-label="Datos principales"
              >
                {vm.specCards.map((card) => (
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

            {vm.damageTagLabels.length > 0 ? (
              <section aria-labelledby="vehicle-damage-heading">
                <h2
                  id="vehicle-damage-heading"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary"
                >
                  Daños registrados
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {vm.damageTags.map((tag, index) => (
                    <li
                      key={tag}
                      className="bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-primary"
                    >
                      {vm.damageTagLabels[index]}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {vm.observations ? (
              <section aria-labelledby="vehicle-observations-heading">
                <h2
                  id="vehicle-observations-heading"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary"
                >
                  Observaciones
                </h2>
                <PublicVehicleInfoCard
                  facts={[]}
                  customNote={vm.observations}
                  hideHeading
                />
              </section>
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex w-full justify-center"
              data-testid="vehicle-whatsapp-cta"
            >
              {vm.ctaLabel}
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
  const vm = buildPublicVehicleViewModel(vehicle);
  return { title: vm.seo.title, description: vm.seo.description };
}
