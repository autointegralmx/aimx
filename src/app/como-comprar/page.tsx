import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export const metadata = {
  title: "Cómo Comprar",
  description:
    "Así te ayudamos a encontrar un vehículo de aseguradora y te acompañamos durante todo el proceso.",
  alternates: { canonical: "/como-comprar" },
};

const steps = [
  "Dinos qué vehículo buscas.",
  "Revisamos las oportunidades disponibles.",
  "Te presentamos opciones con información clara.",
  "Te acompañamos en la compra.",
];

export default function ComoComprarPage() {
  return (
    <PublicShell
      eyebrow="Proceso"
      title="Cómo funciona"
      description="Desde lo que estás buscando hasta concretar la operación: información, asesoría y acompañamiento."
    >
      <ol className="mt-2 space-y-0 md:mt-4 md:grid md:grid-cols-4 md:gap-0">
        {steps.map((label, index) => (
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

      <section className="mt-14 border-t border-border-subtle pt-12 md:mt-20 md:pt-16">
        <p className="label-eyebrow">Compra con información</p>
        <h2 className="text-h3 mt-3 max-w-[20ch] text-text-primary">
          Decide con claridad antes de comprometerte.
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Compara precio",
            "Revisa condición",
            "Calcula costos",
            "Toma una decisión informada",
          ].map((item) => (
            <li
              key={item}
              className="border-t border-border-subtle pt-4 text-[15px] font-medium text-text-primary"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <WhatsAppCta message={whatsappMessages.search} className="mt-12">
        Solicitar búsqueda personalizada
      </WhatsAppCta>
    </PublicShell>
  );
}
