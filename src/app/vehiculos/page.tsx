import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import {
  getInventoryServerContext,
  loadCoverUrlsForVehicles,
  withCovers,
} from "@/modules/inventory/application/public-queries";
import { VehicleCard } from "@/modules/inventory/ui/public-vehicle-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vehículos",
  description:
    "Accidentados, recuperados y seminuevos con acompañamiento Auto Integral.",
};

export default async function VehiculosPage() {
  const { repo } = await getInventoryServerContext();
  const vehicles = await repo.listPublicVehicles({ limit: 24 });
  const covers = await loadCoverUrlsForVehicles(
    vehicles.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );
  const items = withCovers(vehicles, covers);

  return (
    <PublicShell
      eyebrow="Inventario"
      title="Vehículos"
      description="Unidades publicadas con información clara y contacto directo por WhatsApp."
    >
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/vehiculos/accidentados" className="btn-secondary">
          Accidentados
        </Link>
        <Link href="/vehiculos/recuperados" className="btn-secondary">
          Recuperados
        </Link>
        <Link href="/vehiculos/seminuevos" className="btn-secondary">
          Seminuevos
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
          <p className="text-text-secondary">
            Aún no hay vehículos publicados. Contáctanos para una búsqueda
            personalizada.
          </p>
          <WhatsAppCta
            message={whatsappMessages.vehicles}
            className="mt-6 inline-flex"
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ vehicle, coverUrl }) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              coverUrl={coverUrl}
            />
          ))}
        </div>
      )}
    </PublicShell>
  );
}
