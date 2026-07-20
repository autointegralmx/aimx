import { notFound } from "next/navigation";
import {
  getInventoryServerContextOrNull,
} from "@/modules/inventory/application/public-queries";
import {
  PublicVehicleDetail,
  publicVehicleMetadata,
} from "@/modules/inventory/ui/public-vehicle-detail";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

export const dynamic = "force-dynamic";

const reserved = new Set(["accidentados", "recuperados", "seminuevos"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (reserved.has(slug)) return { title: "Vehículo" };
  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) return { title: "Vehículo" };
  try {
    const vehicle = await ctx.repo.getPublicVehicleBySlug(slug);
    if (!vehicle) {
      return { title: "Vehículo no disponible" };
    }
    const meta = publicVehicleMetadata(vehicle);
    return {
      title: meta.title,
      description: meta.description,
      alternates: { canonical: `/vehiculos/${slug}` },
    };
  } catch {
    return { title: "Vehículo" };
  }
}

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (reserved.has(slug)) notFound();

  const ctx = await getInventoryServerContextOrNull();
  if (!ctx) {
    return (
      <PublicShell
        eyebrow="Inventario"
        title="Inventario temporalmente no disponible"
        description="Estamos reconectando el catálogo. Mientras tanto, escríbenos por WhatsApp."
      >
        <WhatsAppCta message={whatsappMessages.vehicles} className="mt-8" />
      </PublicShell>
    );
  }

  const vehicle = await ctx.repo.getPublicVehicleBySlug(slug);
  if (!vehicle?.id) notFound();

  const images = await ctx.mediaRepo.listVehicleMedia(vehicle.id);

  return <PublicVehicleDetail vehicle={vehicle} images={images} />;
}
