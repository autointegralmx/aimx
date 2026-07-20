import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { SocialIconLinks } from "@/shared/ui/social-icon-links";
import {
  buildSiteWhatsAppUrl,
  whatsappMessages,
} from "@/modules/leads/domain/whatsapp";
import { siteContact } from "@/shared/config/site-contact";

export const metadata = {
  title: "Contacto",
  description:
    "Solicita información por WhatsApp o correo sobre vehículos de aseguradora, subastas o servicios Auto Integral.",
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
      : origen === "subastas" || origen === "oportunidades"
        ? whatsappMessages.auctions
        : origen === "vehiculos"
          ? whatsappMessages.vehicles
          : whatsappMessages.hero;
  const whatsappHref = buildSiteWhatsAppUrl(message);

  return (
    <PublicShell
      eyebrow="Contacto"
      title="Hablemos de lo que necesitas"
      description={
        origen
          ? `Cuéntanos más sobre tu interés en ${origen === "oportunidades" ? "subastas" : origen}. Te orientamos de forma directa por WhatsApp o correo.`
          : "Cuéntanos si buscas un vehículo de aseguradora, una unidad en subasta o un servicio automotriz. Te orientamos de forma directa por WhatsApp o correo."
      }
    >
      <div className="mt-10 space-y-6">
        <ul className="space-y-3 text-sm text-text-secondary">
          <li>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              WhatsApp
            </span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex font-medium text-text-primary hover:text-brand-red"
            >
              {siteContact.whatsappDisplay}
            </a>
          </li>
          <li>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Correo
            </span>
            <a
              href={`mailto:${siteContact.email}`}
              className="mt-1 inline-flex font-medium text-text-primary hover:text-brand-red"
            >
              {siteContact.email}
            </a>
          </li>
          <li>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Ubicación
            </span>
            <p className="mt-1 text-text-primary">{siteContact.location}</p>
          </li>
          <li>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Horario
            </span>
            <p className="mt-1 text-text-primary">{siteContact.hours}</p>
          </li>
        </ul>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
            Redes
          </p>
          <SocialIconLinks className="mt-3" />
        </div>

        <WhatsAppCta message={message} />
      </div>
    </PublicShell>
  );
}
