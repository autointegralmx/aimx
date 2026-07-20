import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { loadPublicAuctions } from "@/modules/inventory/application/public-queries";
import { PublicVehicleGrid } from "@/modules/inventory/ui/public-vehicle-grid";

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
        <div className="mt-6 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-5 py-10 text-center md:mt-10 md:px-6 md:py-14">
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
        <div className="mt-6 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-5 py-10 text-center md:mt-10 md:px-6 md:py-14">
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
        <PublicVehicleGrid
          items={items}
          mode="auction"
          className="mt-5 md:mt-10"
        />
      )}
    </PublicShell>
  );
}
