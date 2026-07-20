import { notFound } from "next/navigation";
import {
  getInventoryServerContext,
} from "@/modules/inventory/application/public-queries";
import {
  PublicVehicleDetail,
  publicVehicleMetadata,
} from "@/modules/inventory/ui/public-vehicle-detail";

export const dynamic = "force-dynamic";

const reserved = new Set(["accidentados", "recuperados", "seminuevos"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (reserved.has(slug)) return { title: "Vehículo" };
  const { repo } = await getInventoryServerContext();
  const vehicle = await repo.getPublicVehicleBySlug(slug);
  if (!vehicle) {
    return { title: "Vehículo no disponible" };
  }
  const meta = publicVehicleMetadata(vehicle);
  return {
    title: meta.title,
    description: meta.description,
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

  const { repo, mediaRepo } = await getInventoryServerContext();
  const vehicle = await repo.getPublicVehicleBySlug(slug);
  if (!vehicle?.id) notFound();

  const images = await mediaRepo.listVehicleMedia(vehicle.id);

  return <PublicVehicleDetail vehicle={vehicle} images={images} />;
}
