import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

const reserved = new Set(["accidentados", "recuperados", "seminuevos"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: "Vehículo",
    alternates: { canonical: `/vehiculos/${slug}` },
  };
}

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (reserved.has(slug)) notFound();

  return (
    <PublicShell
      eyebrow="Vehículos"
      title="Vehículo no disponible"
      description="Esta ficha aún no está publicada o el enlace no es válido."
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppCta message={whatsappMessages.vehicles} />
        <Link href="/vehiculos" className="btn-secondary">
          Ver vehículos
        </Link>
      </div>
    </PublicShell>
  );
}
