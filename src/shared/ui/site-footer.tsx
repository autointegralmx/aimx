import Link from "next/link";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { SocialIconLinks } from "@/shared/ui/social-icon-links";
import {
  whatsappMessages,
  buildSiteWhatsAppUrl,
} from "@/modules/leads/domain/whatsapp";
import { siteContact } from "@/shared/config/site-contact";

export function SiteFooter() {
  const whatsappHref = buildSiteWhatsAppUrl(whatsappMessages.finalCta);

  return (
    <footer className="bg-surface-dark text-text-on-dark">
      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-16">
        <div>
          <BrandLogo variant="footer" href="/" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-text-muted-dark">
            Oportunidades reales de vehículos de aseguradora, con acompañamiento
            personalizado.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted-dark">
            Explorar
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            {[
              ["/vehiculos", "Vehículos"],
              ["/subastas", "Subastas"],
              ["/como-comprar", "Cómo comprar"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-text-on-dark">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted-dark">
            Empresa
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            {[
              ["/servicios", "Servicios"],
              ["/nosotros", "Nosotros"],
              ["/contacto", "Contacto"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-text-on-dark">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted-dark">
            Contacto
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-text-on-dark hover:text-brand-red"
              >
                WhatsApp {siteContact.whatsappDisplay}
              </a>
            </li>
            <li>{siteContact.location}</li>
          </ul>
          <SocialIconLinks variant="onDark" className="mt-5" />
        </div>
      </div>

      <div className="border-t border-border-dark">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-text-muted-dark sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Auto Integral. Todos los derechos
            reservados.
          </p>
          <p>
            <Link href="/contacto" className="hover:text-text-on-dark">
              Aviso de privacidad
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
