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
import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";

const messageByCategory: Record<string, string> = {
  Accidentados: whatsappMessages.accidentados,
  Recuperados: whatsappMessages.recuperados,
  Seminuevos: whatsappMessages.seminuevos,
};

const categoryMap: Record<string, VehicleCategory> = {
  Accidentados: "accidentado",
  Recuperados: "recuperado",
  Seminuevos: "seminuevo",
};

export async function CategoryPage({ category }: { category: string }) {
  const message =
    messageByCategory[category] ?? whatsappMessages.vehicles;
  const dbCategory = categoryMap[category];
  const { repo } = await getInventoryServerContext();
  const vehicles = dbCategory
    ? await repo.listPublicVehicles({ category: dbCategory, limit: 48 })
    : [];
  const covers = await loadCoverUrlsForVehicles(
    vehicles.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );
  const items = withCovers(vehicles, covers);

  return (
    <PublicShell
      eyebrow="Vehículos"
      title={category}
      description={`Explora vehículos ${category.toLowerCase()} con información clara y acompañamiento directo.`}
    >
      {items.length === 0 ? (
        <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide text-text-primary">
            Sin unidades publicadas
          </h2>
          <p className="mt-3 text-text-secondary">
            Por ahora no hay vehículos en esta categoría. Escríbenos y te
            ayudamos a buscar.
          </p>
          <WhatsAppCta message={message} className="mt-6 inline-flex" />
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ vehicle, coverUrl }) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                coverUrl={coverUrl}
              />
            ))}
          </div>
          <div className="mt-10">
            <WhatsAppCta message={message} />
          </div>
        </>
      )}
      <p className="mt-8 text-sm">
        <Link href="/vehiculos" className="text-brand-red hover:underline">
          Ver todas las categorías
        </Link>
      </p>
    </PublicShell>
  );
}
