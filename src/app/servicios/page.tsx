import { PublicShell } from "@/shared/ui/public-shell";
import { IconCheck } from "@/shared/ui/icons";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { automotiveServices } from "@/modules/content/data/automotive-services";
import {
  buildServiceWhatsAppMessage,
  whatsappMessages,
} from "@/modules/leads/domain/whatsapp";

export const metadata = {
  title: "Servicios automotrices",
  description:
    "Catálogo integral de servicios automotrices: diagnóstico, mecánica, estética y programación de llaves.",
  alternates: { canonical: "/servicios" },
};

const highlights = [
  {
    id: "diagnostico",
    title: "Diagnóstico con scanner",
    body: "Identificamos fallas con precisión para orientar la reparación correcta desde el inicio.",
  },
  {
    id: "mecanica",
    title: "Mecánica",
    body: "Mantenimiento y reparación con atención clara, seguimiento directo y criterios profesionales.",
  },
  {
    id: "llaves",
    title: "Programación de llaves",
    body: "Duplicados, chip, smart keys, proximidad y soluciones por pérdida, con el mismo estándar de servicio.",
  },
];

export default function ServiciosPage() {
  return (
    <PublicShell
      variant="compact"
      eyebrow="Servicios"
      title="Soluciones para tu vehículo."
      description="Diagnóstico, mecánica, estética y programación de llaves con atención directa."
    >
      <section>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {automotiveServices.map((label) => (
            <li
              key={label}
              className="flex items-start gap-2 border-t border-border-subtle pt-3 text-[15px] text-text-secondary"
            >
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <WhatsAppCta message={whatsappMessages.services} className="mt-10" />
      </section>

      <section className="mt-16 border-t border-border-subtle pt-12 md:mt-20 md:pt-16">
        <h2 className="text-h3 text-text-primary">Más detalle</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.id} className="border-t border-border-subtle pt-5">
              <h3 className="text-base font-semibold tracking-tight text-text-primary">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {item.body}
              </p>
              <WhatsAppCta
                message={buildServiceWhatsAppMessage(item.title)}
                variant="secondary"
                className="mt-5"
                aria-label={`Quiero más información sobre ${item.title}`}
              >
                Consultar
              </WhatsAppCta>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
