import Image from "next/image";
import Link from "next/link";
import { automotiveServices } from "@/modules/content/data/automotive-services";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import {
  IconAdvice,
  IconCheck,
  IconInfo,
  IconMap,
  IconMessage,
  IconSearch,
  IconShield,
  IconWhatsApp,
} from "@/shared/ui/icons";

const impactItems = [
  "Cientos de vehículos disponibles cada semana",
  "Acceso a la subastadora de vehículos de aseguradora más grande del país",
  "Asesoría personalizada",
  "Acompañamiento durante todo el proceso",
];

const categories = [
  {
    title: "Accidentados",
    href: "/vehiculos/accidentados",
    image: "/brand/cat-accidentados.png",
  },
  {
    title: "Recuperados",
    href: "/vehiculos/recuperados",
    image: "/brand/cat-recuperados.png",
  },
  {
    title: "Seminuevos",
    href: "/vehiculos/seminuevos",
    image: "/brand/cat-seminuevos.png",
  },
];

const howItWorks = [
  "Nos dices qué vehículo estás buscando.",
  "Revisamos las unidades disponibles.",
  "Seleccionamos las opciones más convenientes.",
  "Te compartimos fotografías e información.",
  "Te asesoramos durante el proceso.",
  "Te acompañamos hasta concretar la operación.",
];

const trustItems = [
  {
    text: "Acceso a la subastadora de vehículos de aseguradora más grande del país.",
    Icon: IconSearch,
  },
  {
    text: "Selección semanal de oportunidades con información clara.",
    Icon: IconInfo,
  },
  {
    text: "Atención directa y seguimiento por WhatsApp.",
    Icon: IconWhatsApp,
  },
  {
    text: "Acompañamiento durante todo el proceso.",
    Icon: IconShield,
  },
  {
    text: "Cobertura inicial en CDMX y Área Metropolitana.",
    Icon: IconMap,
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      <SiteHeader />
      <main>
        {/* 1. Hero */}
        <section className="relative isolate overflow-hidden">
          <Image
            src="/brand/hero-light.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[58%_42%]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#F7F6F2]/88 via-[#F7F6F2]/45 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#F7F6F2]/25 via-transparent to-transparent"
            aria-hidden
          />
          <div className="container-site relative z-10 flex min-h-[min(78vh,40rem)] items-center py-16 md:py-24">
            <div className="max-w-2xl">
              <p className="label-eyebrow">Auto Integral</p>
              <h1 className="text-hero mt-5 text-text-primary">
                ¿Buscas un vehículo
                <br />
                de aseguradora?
              </h1>
              <p className="mt-5 text-xl font-bold uppercase tracking-wide text-text-primary sm:text-2xl">
                Nosotros lo encontramos por ti.
              </p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
                Tenemos acceso a la subastadora de vehículos de aseguradora más
                grande del país, donde cada semana se publican cientos de
                unidades.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
                Cuéntanos qué vehículo estás buscando y nosotros localizamos las
                mejores oportunidades, te brindamos información clara y te
                acompañamos durante todo el proceso.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <WhatsAppCta message={whatsappMessages.hero} />
                <Link href="/oportunidades" className="btn-secondary">
                  Ver oportunidades de esta semana
                </Link>
              </div>
              <p className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                <IconMap className="h-4 w-4 text-brand-red" />
                CDMX y Área Metropolitana
              </p>
            </div>
          </div>
        </section>

        {/* 2. Impact band */}
        <section className="border-y border-border-subtle bg-surface-primary">
          <div className="container-site grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-12">
            {impactItems.map((item) => (
              <p
                key={item}
                className="text-sm font-semibold uppercase leading-snug tracking-wide text-text-primary"
              >
                <span className="mb-3 block h-0.5 w-8 bg-brand-red" />
                {item}
              </p>
            ))}
          </div>
        </section>

        {/* 3. Personalized search */}
        <section className="bg-surface-secondary section-pad">
          <div className="container-site grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <p className="label-eyebrow">Búsqueda personalizada</p>
              <h2 className="text-h2 mt-3 text-text-primary">
                ¿Qué vehículo
                <br />
                estás buscando?
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg">
                Cada semana revisamos cientos de vehículos disponibles para
                localizar opciones que se ajusten a lo que estás buscando.
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg">
                Escríbenos por WhatsApp y cuéntanos la marca, modelo, año y
                presupuesto aproximado. Nosotros revisamos las oportunidades y
                te orientamos durante todo el proceso.
              </p>
              <WhatsAppCta
                message={whatsappMessages.search}
                className="mt-8"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-surface-primary">
              <Image
                src="/brand/oportunidades-dark.png"
                alt="Vehículo seleccionado para búsqueda personalizada"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* 4. Opportunities */}
        <section className="bg-surface-dark section-pad">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
                Oportunidades
              </p>
              <h2 className="text-h2 mt-4 text-text-on-dark">
                Vehículos seleccionados
                <br />
                de esta semana
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-text-muted-dark sm:text-lg">
                Seleccionamos vehículos disponibles en la subastadora para
                quienes buscan una oportunidad de compra con información clara
                y acompañamiento directo.
              </p>
            </div>

            <div className="mt-12 rounded-[12px] border border-dashed border-border-dark px-6 py-14 text-center">
              <h3 className="text-xl font-bold uppercase tracking-wide text-text-on-dark">
                Próximamente
              </h3>
              <p className="mt-3 text-text-muted-dark">
                Estamos preparando la selección de esta semana.
              </p>
              <WhatsAppCta
                message={whatsappMessages.opportunities}
                variant="onDark"
                className="mt-6"
              />
            </div>

            <Link
              href="/oportunidades"
              className="mt-8 inline-flex text-[15px] font-semibold uppercase tracking-wide text-brand-red"
            >
              Ver oportunidades →
            </Link>
          </div>
        </section>

        {/* 5. Vehicles */}
        <section id="vehiculos" className="bg-surface-primary section-pad">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="label-eyebrow">Vehículos</p>
              <h2 className="text-h2 mt-3 text-text-primary">
                Vehículos disponibles
              </h2>
              <p className="mt-4 text-base text-text-secondary sm:text-lg">
                Explora nuestra selección de vehículos accidentados, recuperados
                y seminuevos.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {categories.map((cat) => (
                <article
                  key={cat.title}
                  className="overflow-hidden rounded-[12px] border border-border-subtle bg-surface-primary shadow-card"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <span className="mb-3 block h-0.5 w-8 bg-brand-red" />
                    <h3 className="text-lg font-bold uppercase tracking-wide text-text-primary">
                      {cat.title}
                    </h3>
                    <Link
                      href={cat.href}
                      className="mt-4 inline-flex text-sm font-semibold uppercase tracking-wide text-brand-red"
                    >
                      Ver vehículos →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/vehiculos" className="btn-secondary">
                Ver todos los vehículos
              </Link>
              <WhatsAppCta
                message={whatsappMessages.vehicles}
                variant="primary"
              />
            </div>
          </div>
        </section>

        {/* 6. How it works */}
        <section className="bg-surface-secondary section-pad">
          <div className="container-site">
            <p className="label-eyebrow">Proceso</p>
            <h2 className="text-h2 mt-3 text-text-primary">Cómo funciona</h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {howItWorks.map((label, index) => (
                <li key={label}>
                  <p className="text-3xl font-bold text-brand-red">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-snug text-text-primary">
                    {label}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. Services */}
        <section id="servicios" className="bg-surface-primary section-pad">
          <div className="container-site">
            <div className="max-w-2xl">
              <h2 className="text-h2 text-text-primary">
                Servicios automotrices
              </h2>
              <p className="mt-4 text-base text-text-secondary sm:text-lg">
                Todo lo que tu vehículo necesita.
              </p>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {automotiveServices.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-3 text-sm text-text-secondary"
                >
                  <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <WhatsAppCta message={whatsappMessages.services} />
              <Link
                href="/servicios"
                className="text-[15px] font-semibold uppercase tracking-wide text-brand-red"
              >
                Ver todos los servicios →
              </Link>
            </div>
          </div>
        </section>

        {/* 8. Why Auto Integral */}
        <section id="confianza" className="bg-surface-dark section-pad">
          <div className="container-site">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
              Confianza
            </p>
            <h2 className="text-h2 mt-3 text-text-on-dark">
              ¿Por qué Auto Integral?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {trustItems.map(({ text, Icon }) => (
                <article
                  key={text}
                  className="border-t border-border-dark pt-6"
                >
                  <Icon className="h-7 w-7 text-brand-red" />
                  <p className="mt-4 text-sm leading-relaxed text-text-on-dark">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="bg-page-background section-pad">
          <div className="container-site max-w-3xl text-center">
            <IconMessage className="mx-auto h-8 w-8 text-brand-red" />
            <h2 className="text-h2 mt-5 text-text-primary">
              ¿Buscas un vehículo
              <br />
              de aseguradora?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              Cuéntanos qué estás buscando. Revisamos las oportunidades
              disponibles y te asesoramos durante todo el proceso.
            </p>
            <WhatsAppCta
              message={whatsappMessages.finalCta}
              className="mt-8"
            />
            <p className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              <IconAdvice className="h-4 w-4 text-brand-red" />
              Respuesta directa por WhatsApp
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
