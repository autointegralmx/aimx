import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { loadPublicAuctions } from "@/modules/inventory/application/public-queries";
import { PublicVehicleGrid } from "@/modules/inventory/ui/public-vehicle-grid";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "En subasta",
  description:
    "Vehículos en subasta activa e historial de subastas cerradas en Auto Integral.",
};

export default async function SubastasPage() {
  const { items, degraded } = await loadPublicAuctions({ scope: "all" });
  const now = new Date();

  const activeItems = items.filter(({ vehicle }) => {
    const auction = buildPublicVehicleViewModel(vehicle, { now }).auction;
    return auction.active;
  });
  const closedItems = items.filter(({ vehicle }) => {
    const auction = buildPublicVehicleViewModel(vehicle, { now }).auction;
    return auction.closed;
  });

  return (
    <PublicShell
      variant="compact"
      eyebrow="Subastas activas"
      title="Oportunidades con fecha de cierre."
      description="Consulta las unidades disponibles y solicita información antes del cierre."
    >
      {degraded ? (
        <div className="mt-6 border border-dashed border-border-subtle bg-surface-secondary px-5 py-12 text-center">
          <p className="text-text-secondary">
            No pudimos cargar las subastas en este momento. Intenta de nuevo más
            tarde.
          </p>
          <Link href="/vehiculos" className="link-editorial mt-6 inline-flex">
            Ver todos los vehículos →
          </Link>
        </div>
      ) : (
        <div className="space-y-14 md:space-y-16">
          <section aria-labelledby="subastas-activas-heading">
            <h2
              id="subastas-activas-heading"
              className="text-base font-semibold tracking-tight text-text-primary md:text-lg"
            >
              Subastas activas
            </h2>
            {activeItems.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">
                No hay subastas activas en este momento.
              </p>
            ) : (
              <PublicVehicleGrid
                items={activeItems}
                mode="auction"
                listMode="all"
                className="mt-5"
              />
            )}
          </section>

          {closedItems.length > 0 ? (
            <section aria-labelledby="subastas-cerradas-heading">
              <h2
                id="subastas-cerradas-heading"
                className="text-base font-semibold tracking-tight text-text-primary md:text-lg"
              >
                Subastas cerradas
              </h2>
              <PublicVehicleGrid
                items={closedItems}
                mode="auction"
                listMode="all"
                className="mt-5"
              />
            </section>
          ) : null}

          {activeItems.length === 0 && closedItems.length === 0 ? (
            <div className="border border-dashed border-border-subtle bg-surface-secondary px-5 py-12 text-center">
              <p className="text-text-secondary">
                No hay vehículos en subasta en este momento.
              </p>
              <Link href="/vehiculos" className="btn-secondary mt-6 inline-flex">
                Ver todos los vehículos
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </PublicShell>
  );
}
