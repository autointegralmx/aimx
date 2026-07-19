import Link from "next/link";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-text-on-dark">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-6 lg:gap-8 lg:py-20">
        <div className="lg:col-span-2">
          <BrandLogo variant="footer" href="/" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-text-muted-dark">
            Vehículos de aseguradora, oportunidades seleccionadas y servicios
            automotrices con asesoría y acompañamiento directo.
          </p>
          <WhatsAppCta
            message={whatsappMessages.finalCta}
            variant="onDark"
            className="mt-6"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
            Explorar
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
            {[
              ["/", "Inicio"],
              ["/vehiculos", "Vehículos"],
              ["/oportunidades", "Oportunidades"],
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
          </ul>
        </div>

        <div className="space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">
              Contacto
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-text-muted-dark">
              <li>WhatsApp disponible</li>
              <li>CDMX y Área Metropolitana</li>
              <li>Lun–Sáb · 10:00–19:00</li>
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
