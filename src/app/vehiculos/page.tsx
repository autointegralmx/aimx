import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export const metadata = {
  title: "Vehículos",
  description:
    "Explora vehículos accidentados, recuperados y seminuevos con información clara y acompañamiento por WhatsApp.",
  alternates: { canonical: "/vehiculos" },
};

const categories = [
  { href: "/vehiculos/accidentados", label: "Accidentados" },
  { href: "/vehiculos/recuperados", label: "Recuperados" },
  { href: "/vehiculos/seminuevos", label: "Seminuevos" },
];

export default function VehiculosPage() {
  return (
    <PublicShell
      eyebrow="Vehículos"
      title="Vehículos disponibles"
      description="Explora nuestra selección de vehículos accidentados, recuperados y seminuevos."
    >
      <div className="mt-10 flex flex-wrap gap-3">
        {categories.map((cat) => (
          <Link key={cat.href} href={cat.href} className="btn-secondary">
            {cat.label}
          </Link>
        ))}
      </div>
      <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wide text-text-primary">
          Próximamente
        </h2>
        <p className="mt-3 text-text-secondary">
          Estamos preparando nuestra selección de vehículos.
        </p>
        <WhatsAppCta
          message={whatsappMessages.vehicles}
          className="mt-6 inline-flex"
        />
      </div>
    </PublicShell>
  );
}
