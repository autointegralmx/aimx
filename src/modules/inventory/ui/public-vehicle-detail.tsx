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

  const cta = vm.auction.canParticipate ? (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-primary inline-flex w-full justify-center"
      data-testid="vehicle-whatsapp-cta"
    >
      {vm.ctaLabel}
    </a>
  ) : vm.auction.closed ? (
    <Link
      href="/subastas"
      className="btn-secondary inline-flex w-full justify-center"
    >
      Consultar unidades disponibles
    </Link>
  ) : (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-primary inline-flex w-full justify-center"
      data-testid="vehicle-whatsapp-cta"
    >
      {vm.ctaLabel}
    </a>
  );

  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      {!preview ? <SiteHeader /> : null}
      <main className="container-site py-6 md:py-10 lg:py-12">
        {preview ? (
          <p className="mb-5 border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
            Vista previa protegida — este vehículo no cambia su estado público.
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <PublicVehicleGallery
            images={images}
            alt={vm.title}
            status={vehicle.status}
          />

          <aside className="space-y-0 lg:sticky lg:top-24">
            {!preview && vm.breadcrumbs.length > 0 ? (
              <nav aria-label="Ruta" className="mb-5 text-xs text-text-secondary">
                <ol className="flex flex-wrap items-center gap-1.5">
                  {vm.breadcrumbs.map((crumb, index) => {
                    const isLast = index === vm.breadcrumbs.length - 1;
                    return (
                      <li
                        key={`${crumb.href}-${crumb.label}`}
                        className="flex items-center gap-1.5"
                      >
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

            <div className="md:hidden">
              <VehicleSoldStatusChip status={vehicle.status} />
            </div>

            {vm.categoryLabel ? (
              <p className="mt-4 label-eyebrow md:mt-0">{vm.categoryLabel}</p>
            ) : null}

            <div className="mt-3 border-b border-border-subtle pb-5">
              <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-text-primary sm:text-[2.125rem]">
                {vm.title}
              </h1>
              {vm.summaryItems.length > 0 ? (
                <p className="mt-2 text-sm text-text-secondary sm:text-[15px]">
                  {vm.summaryItems.join(" · ")}
                </p>
              ) : null}
              <p className="mt-4 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                {vm.priceLabel}
              </p>
              <div className="mt-3 hidden md:block">
                <VehicleSoldStatusChip status={vehicle.status} />
              </div>
            </div>

            <div className="border-b border-border-subtle py-5 md:hidden">
              {cta}
            </div>

            {/* Auction / closed info */}
            {vm.auction.active ? (
              <div className="border-b border-border-subtle py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-red">
                  {vm.auction.badgeLabel}
                </p>
                {vm.auction.closesLong ? (
                  <p className="mt-2 text-sm text-text-secondary">
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

            {vm.auction.closed ? (
              <div className="border-b border-border-subtle py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                  Subasta cerrada
                </p>
                {vm.auction.closedLong ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    Cerró el {vm.auction.closedLong}
                  </p>
                ) : null}
                {vm.auction.awardedLabel ? (
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {vm.auction.awardedLabel}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">
                    Resultado pendiente de publicación
                  </p>
                )}
                <p className="mt-2 text-sm text-text-secondary">
                  Esta subasta ya finalizó y no admite nuevas participaciones.
                </p>
              </div>
            ) : null}

            {vm.specCards.length > 0 ? (
              <ul
                className="divide-y divide-border-subtle border-b border-border-subtle"
                aria-label="Datos principales"
              >
                {vm.specCards.map((card) => (
                  <li
                    key={`${card.label}-${card.value}`}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <span className="text-[13px] text-text-secondary">
                      {card.label}
                    </span>
                    <span className="text-right text-sm font-semibold text-text-primary">
                      {card.value}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {vm.operationalBadges.length > 0 ||
            vm.documentationBadges.length > 0 ||
            vm.infoFacts.length > 0 ? (
              <ul
                className="flex flex-wrap gap-2 border-b border-border-subtle py-5"
                aria-label="Características del vehículo"
              >
                {[
                  ...vm.operationalBadges,
                  ...vm.documentationBadges,
                  ...vm.infoFacts,
                ].map((badge) => (
                  <li
                    key={badge}
                    className="border border-border-subtle px-2.5 py-1 text-xs font-medium text-text-primary"
                  >
                    {badge}
                  </li>
                ))}
              </ul>
            ) : null}

            {vm.damageTagLabels.length > 0 ? (
              <section
                aria-labelledby="vehicle-damage-heading"
                className="border-b border-border-subtle py-5"
              >
                <h2
                  id="vehicle-damage-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary"
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
              <section
                aria-labelledby="vehicle-observations-heading"
                className="border-b border-border-subtle py-5"
              >
                <h2
                  id="vehicle-observations-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary"
                >
                  Observaciones
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-text-primary">
                  {vm.observations}
                </p>
              </section>
            ) : null}

            <div className="hidden space-y-4 pt-6 md:block">
              {cta}
              {!preview ? (
                <Link
                  href="/vehiculos"
                  className="inline-flex text-sm text-text-secondary hover:text-text-primary"
                >
                  ← Volver a vehículos
                </Link>
              ) : null}
            </div>

            {!preview ? (
              <p className="pt-6 text-xs leading-relaxed text-text-secondary md:pt-4">
                La información publicada es orientativa. Confirma disponibilidad
                y condiciones antes de decidir.
              </p>
            ) : null}

            {!preview ? (
              <div className="pt-4 md:hidden">
                <Link
                  href="/vehiculos"
                  className="inline-flex text-sm text-text-secondary hover:text-text-primary"
                >
                  ← Volver a vehículos
                </Link>
              </div>
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
