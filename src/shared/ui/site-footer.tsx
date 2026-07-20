import Link from "next/link";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { SocialIconLinks } from "@/shared/ui/social-icon-links";
import { whatsappMessages, buildSiteWhatsAppUrl } from "@/modules/leads/domain/whatsapp";
import { siteContact } from "@/shared/config/site-contact";

export function SiteFooter() {
  const whatsappHref = buildSiteWhatsAppUrl(whatsappMessages.finalCta);

  return (
    <footer className="bg-surface-dark text-text-on-dark">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-6 lg:gap-8 lg:py-20">
        <div className="lg:col-span-2">
          <BrandLogo variant="footer" href="/" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-text-muted-dark">
            Vehículos de aseguradora, autopartes y servicios automotrices con
            asesoría y acompañamiento directo.
          </p>
          <WhatsAppCta
            message={whatsappMessages.finalCta}
            variant="onDark"
            className="mt-6"
          />
          <SocialIconLinks variant="onDark" className="mt-5" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
            Explorar
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            {[
              ["/", "Inicio"],
              ["/vehiculos", "Vehículos"],
              ["/subastas", "En subasta"],
              ["/como-comprar", "Cómo Comprar"],
              ["/nosotros", "Nosotros"],
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
            Vehículos
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            {[
              ["/vehiculos/accidentados", "Accidentados"],
              ["/vehiculos/recuperados", "Recuperados"],
              ["/vehiculos/seminuevos", "Seminuevos"],
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
            Servicios
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            <li>
              <Link href="/servicios" className="hover:text-text-on-dark">
                Servicios automotrices
              </Link>
            </li>
            <li>
              <Link href="/#autopartes" className="hover:text-text-on-dark">
                Autopartes
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
              Contacto
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-on-dark"
                >
                  WhatsApp {siteContact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteContact.email}`}
                  className="hover:text-text-on-dark"
                >
                  {siteContact.email}
                </a>
              </li>
              <li>{siteContact.location}</li>
              <li>{siteContact.hours}</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
              Legal
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
              <li>
                <Link href="/contacto" className="hover:text-text-on-dark">
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-text-on-dark">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border-dark">
        <p className="container-site py-5 text-xs text-text-muted-dark">
          © {new Date().getFullYear()} Auto Integral. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
