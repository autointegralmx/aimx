import Image from "next/image";
import {
  AnimatedStat,
  Reveal,
} from "@/modules/content/ui/nosotros-motion";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import {
  IconAdvice,
  IconCheck,
  IconShield,
  IconSparkle,
} from "@/shared/ui/icons";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SiteHeader } from "@/shared/ui/site-header";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";

const advantages = [
  {
    title: "Más de 10 años de experiencia",
    Icon: IconCheck,
  },
  {
    title: "Compra 100% legal y segura",
    Icon: IconShield,
  },
  {
    title: "Asesoría profesional personalizada",
    Icon: IconAdvice,
  },
  {
    title: "Acceso a oportunidades exclusivas de aseguradoras",
    Icon: IconSparkle,
  },
] as const;

export function NosotrosPageView() {
  return (
    <div className="min-h-screen bg-page-background text-text-primary">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(210_10_17_/_0.05),_transparent_55%),linear-gradient(180deg,#f7f6f2_0%,#f1f1ee_48%,#f7f6f2_100%)]"
            aria-hidden
          />
          <div className="container-site relative section-pad">
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">
              <div className="min-w-0">
                <Reveal>
                  <p className="label-eyebrow">Más de 10 años de experiencia</p>
                  <h1 className="text-h2 mt-4 max-w-xl text-text-primary">
                    La forma más segura de comprar un vehículo de aseguradora
                  </h1>
                  <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-text-secondary sm:text-lg">
                    <p>
                      En Auto Integral llevamos más de una década ayudando a
                      nuestros clientes a adquirir vehículos de aseguradora de
                      forma completamente legal, segura y transparente.
                    </p>
                    <p>
                      Trabajamos con un equipo especializado que analiza cada
                      unidad, verifica su historial y acompaña al cliente durante
                      todo el proceso de compra para que tome una decisión con
                      total confianza.
                    </p>
                    <p>
                      Nuestro compromiso es ofrecer únicamente oportunidades
                      reales, con asesoría profesional y un servicio
                      personalizado antes, durante y después de la compra.
                    </p>
                  </div>
                  <div className="mt-8">
                    <WhatsAppCta
                      message={whatsappMessages.hero}
                      aria-label="Quiero encontrar mi auto por WhatsApp"
                      className="shadow-[0_10px_28px_rgb(210_10_17_/_0.22)] transition-[transform,box-shadow,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgb(210_10_17_/_0.3)]"
                    >
                      Quiero encontrar mi auto
                    </WhatsAppCta>
                  </div>
                </Reveal>

                <div className="mt-12 flex flex-col gap-12 lg:mt-14">
                  <Reveal delayMs={80} className="order-2 lg:order-1">
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {advantages.map(({ title, Icon }) => (
                        <li key={title}>
                          <div className="group flex h-full items-start gap-3 rounded-[12px] border border-border-subtle bg-surface-primary/80 px-4 py-4 transition-[transform,border-color,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:border-brand-red/35 hover:bg-surface-primary hover:shadow-[var(--shadow-card)]">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-page-background text-brand-red transition-colors duration-300 group-hover:border-brand-red/40 group-hover:bg-brand-red group-hover:text-white">
                              <Icon className="h-4 w-4" />
                            </span>
                            <p className="pt-1.5 text-sm font-semibold leading-snug text-text-primary">
                              {title}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal delayMs={120} className="order-1 lg:order-2">
                    <div className="grid gap-8 border-y border-border-subtle bg-surface-primary/70 px-5 py-8 sm:grid-cols-3 sm:gap-6 sm:px-6 sm:py-10">
                      <AnimatedStat
                        prefix="+"
                        value={10}
                        label="Años de experiencia"
                      />
                      <AnimatedStat
                        prefix="+"
                        value={1000}
                        label="Clientes asesorados"
                      />
                      <AnimatedStat
                        value={100}
                        suffix="%"
                        label="Compra legal y transparente"
                      />
                    </div>
                  </Reveal>
                </div>
              </div>

              <Reveal delayMs={140} className="lg:sticky lg:top-28">
                <NosotrosVisualComposition />
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function NosotrosVisualComposition() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-brand-red/10 via-transparent to-brand-black/5 blur-2xl"
        aria-hidden
      />
      <div className="relative grid grid-cols-12 grid-rows-[auto_auto] gap-3 sm:gap-4">
        <div className="relative col-span-12 aspect-[16/11] overflow-hidden rounded-[18px] shadow-[var(--shadow-card)] sm:col-span-8 sm:row-span-2 sm:aspect-auto sm:min-h-[22rem]">
          <Image
            src="/brand/hero-automotive.png"
            alt="Inspección profesional de un vehículo de aseguradora"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-center"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-black/35 via-transparent to-transparent"
            aria-hidden
          />
          <p className="absolute bottom-4 left-4 right-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
            Inspección y acompañamiento profesional
          </p>
        </div>

        <div className="relative col-span-6 aspect-[4/5] overflow-hidden rounded-[16px] shadow-[var(--shadow-card)] sm:col-span-4 sm:aspect-[4/5]">
          <Image
            src="/brand/cat-accidentados.png"
            alt="Vehículo de aseguradora disponible en inventario"
            fill
            sizes="(max-width: 1024px) 45vw, 18vw"
            className="object-cover object-[50%_40%]"
          />
        </div>

        <div className="relative col-span-6 aspect-[4/5] overflow-hidden rounded-[16px] shadow-[var(--shadow-card)] sm:col-span-4">
          <Image
            src="/brand/cat-seminuevos.png"
            alt="Unidad revisada lista para proceso de compra"
            fill
            sizes="(max-width: 1024px) 45vw, 18vw"
            className="object-cover object-center"
          />
        </div>

        <div className="relative col-span-7 aspect-[5/3] overflow-hidden rounded-[16px] shadow-[var(--shadow-card)] sm:col-span-7">
          <Image
            src="/brand/oportunidades-dark.png"
            alt="Documentación y proceso de compra transparente"
            fill
            sizes="(max-width: 1024px) 60vw, 28vw"
            className="object-cover object-[50%_55%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-brand-black/25 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative col-span-5 overflow-hidden rounded-[16px] border border-border-subtle bg-surface-primary p-4 shadow-[var(--shadow-card)] sm:col-span-5 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-red">
            Proceso claro
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-text-primary">
            Historial verificado, asesoría directa y compra 100% legal.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
            <span className="h-1.5 w-8 rounded-full bg-border-subtle" />
            <span className="h-1.5 w-4 rounded-full bg-border-subtle" />
          </div>
        </div>
      </div>
    </div>
  );
}
