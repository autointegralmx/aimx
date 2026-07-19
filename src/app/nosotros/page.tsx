import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export const metadata = {
  title: "Nosotros",
  description:
    "Auto Integral: acceso a la subastadora de vehículos de aseguradora más grande del país, oportunidades seleccionadas y acompañamiento directo.",
  alternates: { canonical: "/nosotros" },
};

export default function NosotrosPage() {
  return (
    <PublicShell
      eyebrow="Nosotros"
      title="Auto Integral"
      description="Ayudamos a encontrar vehículos de aseguradora mediante acceso a la subastadora más grande del país, seleccionamos oportunidades y acompañamos al cliente durante todo el proceso."
    >
      <WhatsAppCta message={whatsappMessages.hero} className="mt-10" />
    </PublicShell>
  );
}
