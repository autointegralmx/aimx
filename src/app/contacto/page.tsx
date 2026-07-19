import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export const metadata = {
  title: "Contacto",
  description:
    "Solicita información por WhatsApp sobre vehículos de aseguradora, oportunidades o servicios Auto Integral.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string }>;
}) {
  const { origen } = await searchParams;
  const message =
    origen === "servicios"
      ? whatsappMessages.services
      : origen === "oportunidades"
        ? whatsappMessages.opportunities
        : origen === "vehiculos"
          ? whatsappMessages.vehicles
          : whatsappMessages.hero;

  return (
    <PublicShell
      eyebrow="Contacto"
      title="Hablemos de lo que necesitas"
      description={
        origen
          ? `Cuéntanos más sobre tu interés en ${origen}. Te orientamos de forma directa por WhatsApp.`
          : "Cuéntanos si buscas un vehículo de aseguradora, una oportunidad o un servicio automotriz. Te orientamos de forma directa por WhatsApp."
      }
    >
      <WhatsAppCta message={message} className="mt-10" />
    </PublicShell>
  );
}
