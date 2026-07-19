import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export const metadata = {
  title: "Oportunidades",
  description:
    "Vehículos seleccionados de esta semana disponibles en la subastadora, con información clara y acompañamiento directo por WhatsApp.",
  alternates: { canonical: "/oportunidades" },
};

export default function OportunidadesPage() {
  return (
    <PublicShell
      eyebrow="Oportunidades"
      title="Vehículos seleccionados de esta semana"
      description="Seleccionamos vehículos disponibles en la subastadora para quienes buscan una oportunidad de compra con información clara y acompañamiento directo. Sin pujas públicas ni compra en línea."
    >
      <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wide text-text-primary">
          Próximamente
        </h2>
        <p className="mt-3 text-text-secondary">
          Estamos preparando la selección de esta semana.
        </p>
        <WhatsAppCta
          message={whatsappMessages.opportunities}
          className="mt-6 inline-flex"
        />
      </div>
      <p className="mt-8 text-sm text-text-secondary">
        También puedes{" "}
        <Link href="/vehiculos" className="font-medium text-brand-red">
          explorar vehículos disponibles
        </Link>
        .
      </p>
    </PublicShell>
  );
}
