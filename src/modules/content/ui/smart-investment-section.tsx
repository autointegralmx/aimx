"use client";

import Image from "next/image";
import { Reveal } from "@/modules/content/ui/nosotros-motion";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import {
  IconAdvice,
  IconCheck,
  IconDocs,
  IconScan,
  IconShield,
} from "@/shared/ui/icons";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";

const reasons = [
  "Se adquieren por debajo del valor comercial.",
  "Existe alta demanda en el mercado de vehículos seminuevos.",
  "Tú decides si conservarlo, repararlo o venderlo posteriormente.",
  "Te acompañamos durante todo el proceso de compra.",
] as const;

const pillars = [
  {
    title: "Precio competitivo",
    text: "Acceso a vehículos con precios muy por debajo del mercado tradicional.",
    Icon: IconCheck,
  },
  {
    title: "Selección profesional",
    text: "Analizamos cada oportunidad antes de recomendarla.",
    Icon: IconScan,
  },
  {
    title: "Compra segura",
    text: "Todo el proceso se realiza de forma legal y transparente.",
    Icon: IconShield,
  },
  {
    title: "Asesoría personalizada",
    text: "Te ayudamos a encontrar la unidad que mejor se adapte a tu objetivo.",
    Icon: IconAdvice,
  },
] as const;

export function SmartInvestmentSection() {
  return (
    <section
      id="inversion-inteligente"
      className="bg-surface-primary section-pad"
      aria-labelledby="inversion-inteligente-heading"
    >
      <div className="container-site">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <div className="min-w-0">
            <Reveal>
              <p className="label-eyebrow">Inversión inteligente</p>
              <h2
                id="inversion-inteligente-heading"
                className="text-h2 mt-4 max-w-2xl text-text-primary"
              >
                ¿Tienes dinero extra y no sabes en qué invertir?
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-text-primary sm:text-lg">
                Un vehículo de aseguradora bien comprado puede convertirse en
                una excelente oportunidad para proteger el valor de tu dinero y
                obtener una utilidad al venderlo posteriormente.
              </p>
              <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-text-secondary sm:text-[17px]">
                <p>
                  Muchas personas compran vehículos de aseguradora no únicamente
                  para usarlos, sino también como una forma inteligente de
                  invertir.
                </p>
                <p>
                  Al adquirir una unidad a un precio por debajo del mercado y
                  elegir correctamente la oportunidad, es posible obtener un
                  importante margen de valor una vez reparada o simplemente
                  conservar un activo que mantiene una alta demanda.
                </p>
                <p>
                  En Auto Integral analizamos cada vehículo, revisamos su
                  historial y te ayudamos a identificar las mejores
                  oportunidades para que tomes una decisión con información y
                  respaldo profesional.
                </p>
                <p className="font-medium text-text-primary">
                  No vendemos cualquier vehículo.
                  <br />
                  Seleccionamos únicamente oportunidades que realmente valen la
                  pena.
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={80}>
              <aside className="mt-10 rounded-[14px] bg-surface-dark px-6 py-7 text-text-on-dark sm:px-8 sm:py-8">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white sm:text-[15px]">
                  ¿Por qué muchas personas invierten en autos de aseguradora?
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-3 text-sm leading-relaxed text-text-muted-dark sm:text-[15px]"
                    >
                      <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </Reveal>
          </div>

          <Reveal delayMs={100} className="lg:sticky lg:top-28">
            <InvestmentVisualComposition />
          </Reveal>
        </div>

        <Reveal delayMs={60}>
          <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-5">
            {pillars.map(({ title, text, Icon }) => (
              <li key={title}>
                <article className="group h-full border border-border-subtle bg-page-background px-5 py-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-brand-red/30 hover:shadow-[var(--shadow-card)]">
                  <Icon className="h-7 w-7 text-brand-red transition-transform duration-300 group-hover:scale-105" />
                  <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-text-primary">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {text}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delayMs={80}>
          <blockquote className="mx-auto mt-16 max-w-3xl border-y border-border-subtle py-10 text-center lg:mt-20">
            <p className="text-xl font-semibold leading-snug tracking-tight text-text-primary sm:text-2xl sm:leading-snug">
              “Las mejores oportunidades aparecen cuando compras con
              información, experiencia y el respaldo adecuado.”
            </p>
          </blockquote>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-10 flex justify-center lg:mt-12">
            <WhatsAppCta
              message={whatsappMessages.investment}
              aria-label="Quiero conocer oportunidades de inversión por WhatsApp"
              className="shadow-[0_10px_28px_rgb(210_10_17_/_0.18)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgb(210_10_17_/_0.28)]"
            >
              Quiero conocer oportunidades de inversión
            </WhatsAppCta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function InvestmentVisualComposition() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="absolute -inset-3 rounded-[24px] bg-gradient-to-br from-brand-red/[0.06] via-transparent to-brand-black/[0.04] blur-xl"
        aria-hidden
      />
      <div className="relative grid grid-cols-12 gap-3">
        <div className="relative col-span-12 aspect-[5/4] overflow-hidden rounded-[16px] shadow-[var(--shadow-card)] sm:aspect-[4/3]">
          <Image
            src="/brand/hero-light.png"
            alt="Vehículo premium evaluado como oportunidad de inversión"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-[58%_42%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-black/40 via-transparent to-transparent"
            aria-hidden
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95">
              Oportunidades seleccionadas
            </p>
            <span className="rounded-sm bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-black">
              Potencial de valorización
            </span>
          </div>
        </div>

        <div className="relative col-span-7 aspect-[5/4] overflow-hidden rounded-[14px] shadow-[var(--shadow-card)]">
          <Image
            src="/brand/cat-recuperados.png"
            alt="Revisión profesional de unidad antes de recomendarla"
            fill
            sizes="(max-width: 1024px) 55vw, 22vw"
            className="object-cover object-center"
          />
        </div>

        <div className="col-span-5 flex flex-col gap-3">
          <div className="relative flex-1 overflow-hidden rounded-[14px] border border-border-subtle bg-page-background p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <IconDocs className="h-4 w-4 text-brand-red" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                Análisis
              </p>
            </div>
            <p className="mt-3 text-xs font-semibold leading-snug text-text-primary">
              Historial, demanda y precio de mercado revisados antes de
              recomendar.
            </p>
            <SubtleGrowthChart className="mt-4" />
          </div>
          <div className="rounded-[14px] border border-border-subtle bg-surface-dark px-4 py-3.5 shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-red">
              Decisión respaldada
            </p>
            <p className="mt-2 text-xs leading-snug text-text-muted-dark">
              Comprar por debajo del precio de mercado con acompañamiento
              profesional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubtleGrowthChart({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 48"
      className={`h-12 w-full text-brand-red ${className}`}
      aria-hidden
    >
      <path
        d="M4 40 C28 38, 36 28, 52 26 S84 30, 100 18 S132 10, 156 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M4 40 C28 38, 36 28, 52 26 S84 30, 100 18 S132 10, 156 8 V48 H4 Z"
        fill="currentColor"
        opacity="0.08"
      />
      <circle cx="156" cy="8" r="2.5" fill="currentColor" />
      <line
        x1="4"
        y1="44"
        x2="156"
        y2="44"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.2"
      />
    </svg>
  );
}
