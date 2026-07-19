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
  "Nos dices qué vehículo estás buscando.",
  "Revisamos las unidades disponibles.",
  "Seleccionamos las opciones más convenientes.",
  "Te compartimos fotografías e información.",
  "Te asesoramos durante el proceso.",
  "Te acompañamos hasta concretar la operación.",
];

export default function ComoComprarPage() {
  return (
    <PublicShell
      eyebrow="Proceso"
      title="Cómo funciona"
      description="Desde lo que estás buscando hasta concretar la operación: información, asesoría y acompañamiento."
    >
      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((label, index) => (
          <li
            key={label}
            className="border border-border-subtle bg-surface-primary px-5 py-4"
          >
            <p className="text-2xl font-bold text-brand-red">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm font-medium text-text-primary">{label}</p>
          </li>
        ))}
      </ol>
      <WhatsAppCta message={whatsappMessages.search} className="mt-10" />
    </PublicShell>
  );
}
