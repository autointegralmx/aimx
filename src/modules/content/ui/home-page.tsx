import Image from "next/image";
import Link from "next/link";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import {
  loadHomeInventoryData,
} from "@/modules/inventory/application/public-queries";
import { PublicVehicleGrid } from "@/modules/inventory/ui/public-vehicle-grid";
import { VehicleCategoryChips } from "@/modules/inventory/ui/vehicle-category-chips";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import { autopartCategories } from "@/modules/content/data/autoparts";

const howItWorks = [
  "Dinos qué vehículo buscas.",
  "Revisamos las oportunidades disponibles.",
  "Te presentamos opciones con información clara.",
  "Te acompañamos en la compra.",
];

const trustPillars = [
  {
    title: "Experiencia real",
    text: "Más de 10 años trabajando con vehículos de aseguradora.",
  },
  {
    title: "Compra informada",
    text: "Te ayudamos a revisar condición, documentación y costos antes de decidir.",
  },
  {
    title: "Acompañamiento completo",
    text: "Estamos contigo desde la búsqueda hasta la adjudicación y entrega.",
  },
];

const serviceGroups = [
  {
    title: "Diagnóstico y mecánica",
    description: "Scanner, frenos, suspensión y mantenimiento general.",
  },
  {
    title: "Hojalatería y pintura",
    description: "Reparación de carrocería con acabado profesional.",
  },
  {
    title: "Estética automotriz",
    description: "Detallado y presentación para entrega o reventa.",
  },
  {
    title: "Llaves automotrices",
    description: "Programación, duplicados y apertura de vehículos.",
  },
];

function HeroFeaturedUnit({
  vehicle,
  coverUrl,
}: {
  vehicle: PublicVehicle;
  coverUrl?: string | null;
}) {
  if (!vehicle.slug) return null;
  const vm = buildPublicVehicleViewModel(vehicle);
  const unoptimized = Boolean(
    coverUrl?.includes("/storage/v1/object/public/"),
  );

  return (
    <Link
      href={`/vehiculos/${vm.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden bg-surface-secondary sm:aspect-[5/6]"
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={vm.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="img-zoom object-cover"
          unoptimized={unoptimized}
        />
      ) : (
        <Image
          src="/brand/hero-light.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
        {vm.categoryLabel ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
            {vm.categoryLabel}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
          {vm.title}
        </h2>
        <p className="mt-1 text-sm text-white/80">
          {[vm.year, vehicle.transmission].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-3 text-lg font-semibold">
          {vm.listPriceLabel ?? "Precio por confirmar"}
        </p>
        {vm.auction.active && vm.auction.closesLabel ? (
          <p className="mt-1 text-sm text-white/85">{vm.auction.closesLabel}</p>
        ) : null}
        <span className="mt-4 inline-flex text-sm font-semibold text-white">
          Consultar unidad →
        </span>
      </div>
    </Link>
  );
}

export async function HomePage() {
  const { auctions: auctionItems, featured: featuredItems } =
    await loadHomeInventoryData();

  const featuredUnit = featuredItems[0] ?? auctionItems[0] ?? null;

  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      <SiteHeader />
      <main>
        {/* Hero showroom */}
        <section className="section-light">
          <div className="container-site grid items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-16 xl:py-20">
            <div className="order-1 max-w-xl">
              <p className="label-eyebrow">Vehículos de aseguradora</p>
              <h1 className="text-hero mt-4 text-text-primary">
                Encuentra una mejor oportunidad para comprar tu próximo
                vehículo.
              </h1>
              <p className="text-body-editorial mt-5 max-w-[36ch] text-text-secondary">
                Accedemos a cientos de unidades cada semana y te acompañamos
                desde la búsqueda hasta la compra.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <WhatsAppCta message={whatsappMessages.search}>
                  Buscar mi vehículo
                </WhatsAppCta>
                <Link href="/subastas" className="btn-secondary">
                  Ver vehículos en subasta
                </Link>
              </div>
              <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-text-secondary md:text-[13px]">
                <span>300–400 unidades por semana</span>
                <span className="hidden text-border-subtle sm:inline" aria-hidden>
                  |
                </span>
                <span>10 años de experiencia</span>
                <span className="hidden text-border-subtle sm:inline" aria-hidden>
                  |
                </span>
                <span>CDMX y EdoMéx</span>
              </p>
            </div>

            <div className="order-2">
              {featuredUnit ? (
                <HeroFeaturedUnit
                  vehicle={featuredUnit.vehicle}
                  coverUrl={featuredUnit.coverUrl}
                />
              ) : (
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-secondary sm:aspect-[5/6]">
                  <Image
                    src="/brand/hero-light.png"
                    alt="Auto Integral — showroom"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover object-[58%_42%]"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="section-paper divider-hairline">
          <div className="container-site">
            <ul className="grid divide-y divide-border-subtle md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                { k: "300–400", v: "vehículos por semana" },
                { k: "10 años", v: "de experiencia" },
                { k: "Acompañamiento", v: "de principio a fin" },
              ].map((item) => (
                <li
                  key={item.k}
                  className="flex flex-col gap-1 py-6 md:px-8 md:py-10 first:md:pl-0 last:md:pr-0"
                >
                  <p className="text-xl font-semibold tracking-tight text-text-primary md:text-2xl">
                    {item.k}
                  </p>
                  <p className="text-sm text-text-secondary md:text-[15px]">
                    {item.v}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Auctions */}
        <section className="section-dark section-pad">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="label-eyebrow">Subastas activas</p>
              <h2 className="text-h2 mt-3 text-text-on-dark">
                Oportunidades con fecha de cierre.
              </h2>
              <p className="mt-4 max-w-xl text-body-editorial text-text-muted-dark">
                Consulta las unidades disponibles y solicita información antes
                del cierre.
              </p>
            </div>

            {auctionItems.length === 0 ? (
              <p className="mt-10 text-text-muted-dark">
                No hay subastas activas en este momento.
              </p>
            ) : (
              <PublicVehicleGrid
                items={auctionItems}
                variant="onDark"
                mode="auction"
                listMode="preview"
                limit={6}
                density="compact"
                className="mt-10 md:mt-12"
              />
            )}

            <Link href="/subastas" className="link-editorial mt-10">
              Ver todas las subastas →
            </Link>
          </div>
        </section>

        {/* Inventory */}
        <section id="vehiculos" className="section-paper section-pad">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="label-eyebrow">Vehículos disponibles</p>
              <h2 className="text-h2 mt-3 text-text-primary">
                Explora las oportunidades actuales.
              </h2>
              <p className="mt-4 text-body-editorial text-text-secondary">
                Unidades accidentadas, recuperadas y seminuevas seleccionadas.
              </p>
            </div>

            <VehicleCategoryChips className="mt-6" />

            {featuredItems.length > 0 ? (
              <PublicVehicleGrid
                items={featuredItems}
                listMode="preview"
                limit={8}
                density="compact"
                className="mt-6 md:mt-8"
              />
            ) : null}

            <div className="mt-10">
              <Link href="/vehiculos" className="btn-secondary">
                Ver todos los vehículos
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="section-muted section-pad">
          <div className="container-site">
            <p className="label-eyebrow">Proceso</p>
            <h2 className="text-h2 mt-3 text-text-primary">Cómo funciona</h2>
            <ol className="mt-10 space-y-0 md:mt-14 md:grid md:grid-cols-4 md:gap-0">
              {howItWorks.map((label, index) => (
                <li
                  key={label}
                  className="relative flex gap-4 border-b border-border-subtle py-6 last:border-b-0 md:flex-col md:border-b-0 md:border-l md:border-border-subtle md:px-6 md:py-0 first:md:border-l-0 first:md:pl-0"
                >
                  <p className="shrink-0 text-3xl font-semibold tabular-nums tracking-tight text-brand-red md:text-4xl">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="max-w-[22ch] pt-1 text-[15px] leading-snug text-text-primary md:pt-4 md:text-base">
                    {label}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Personal search */}
        <section className="section-light section-pad">
          <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="label-eyebrow">Búsqueda personalizada</p>
              <h2 className="text-h2 mt-3 max-w-[16ch] text-text-primary">
                El vehículo que buscas puede no estar publicado todavía.
              </h2>
              <p className="mt-5 max-w-[40ch] text-body-editorial text-text-secondary">
                Dinos marca, modelo y presupuesto. Revisamos las oportunidades
                disponibles y te presentamos opciones reales.
              </p>
              <WhatsAppCta
                message={whatsappMessages.search}
                className="mt-8"
                aria-label="Solicitar búsqueda personalizada por WhatsApp"
              >
                Solicitar búsqueda personalizada
              </WhatsAppCta>
            </div>
            <div className="relative hidden aspect-[5/4] overflow-hidden bg-surface-secondary lg:block">
              <Image
                src="/brand/oportunidades-dark.png"
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* Services (secondary) */}
        <section id="servicios" className="section-paper section-pad">
          <div className="container-site">
            <div className="max-w-xl">
              <p className="label-eyebrow-muted">Servicios</p>
              <h2 className="text-h2 mt-3 text-text-primary">
                Soluciones para tu vehículo.
              </h2>
            </div>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {serviceGroups.map((service) => (
                <li key={service.title} className="border-t border-border-subtle pt-5">
                  <h3 className="text-base font-semibold tracking-tight text-text-primary">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {service.description}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/servicios" className="link-editorial mt-10">
              Ver servicios →
            </Link>
          </div>
        </section>

        {/* Autopartes — muted */}
        <section id="autopartes" className="section-muted section-pad">
          <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="label-eyebrow-muted">Autopartes</p>
              <h2 className="text-h2 mt-3 text-text-primary">
                ¿No encuentras la pieza?
              </h2>
              <p className="mt-4 max-w-[42ch] text-body-editorial text-text-secondary">
                Cotizamos refacciones con nuestra red de distribuidores en CDMX
                y EdoMéx. Sin catálogo inventado: te ayudamos bajo solicitud.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {autopartCategories.slice(0, 8).map((part) => (
                  <li
                    key={part}
                    className="border border-border-subtle bg-surface-primary px-3 py-1.5 text-xs text-text-secondary"
                  >
                    {part}
                  </li>
                ))}
              </ul>
              <WhatsAppCta
                message={whatsappMessages.autopartes}
                variant="secondary"
                className="mt-8"
                aria-label="Cotizar autoparte por WhatsApp"
              >
                Cotizar una autoparte
              </WhatsAppCta>
            </div>
            <div className="relative aspect-[5/4] overflow-hidden bg-surface-secondary">
              <Image
                src="/brand/oportunidades-dark.png"
                alt="Detalle automotriz"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Trust pillars */}
        <section className="section-light section-pad">
          <div className="container-site">
            <p className="label-eyebrow">Confianza</p>
            <h2 className="text-h2 mt-3 text-text-primary">
              Por qué Auto Integral.
            </h2>
            <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
              {trustPillars.map((pillar, index) => (
                <li key={pillar.title}>
                  <p className="text-sm font-semibold tabular-nums text-brand-red">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-text-primary">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                    {pillar.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-paper section-pad-compact divider-hairline">
          <div className="container-site flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-h3 text-text-primary">
                ¿Listo para encontrar tu próxima unidad?
              </h2>
              <p className="mt-2 text-text-secondary">
                Escríbenos y te orientamos con información clara.
              </p>
            </div>
            <WhatsAppCta message={whatsappMessages.finalCta}>
              Hablar por WhatsApp
            </WhatsAppCta>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
