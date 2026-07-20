import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { loadPublicAuctions } from "@/modules/inventory/application/public-queries";
import { AuctionVehicleCard } from "@/modules/inventory/ui/auction-vehicle-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "En subasta",
  description:
    "Vehículos disponibles mediante subasta. Consulta el cierre y solicita información para participar.",
};

export default async function SubastasPage() {
  const { items, degraded } = await loadPublicAuctions(24);

  return (
    <PublicShell
      eyebrow="Subastas"
      title="En subasta"
      description="Vehículos disponibles mediante subasta. Consulta el cierre y solicita información para participar."
    >
      {degraded ? (
        <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
          <p className="text-text-secondary">
            No pudimos cargar las subastas en este momento. Intenta de nuevo más
            tarde.
          </p>
          <Link
            href="/vehiculos"
            className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wide text-brand-red"
          >
            Ver todos los vehículos
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
          <p className="text-text-secondary">
            No hay vehículos en subasta en este momento.
          </p>
          <Link
            href="/vehiculos"
            className="btn-secondary mt-6 inline-flex"
          >
            Ver todos los vehículos
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ vehicle, coverUrl }) => (
            <AuctionVehicleCard
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
