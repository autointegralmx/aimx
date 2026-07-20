import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import { loadPublicVehicleList } from "@/modules/inventory/application/public-queries";
import { PublicVehicleGrid } from "@/modules/inventory/ui/public-vehicle-grid";
import { VehicleCategoryChips } from "@/modules/inventory/ui/vehicle-category-chips";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vehículos",
  description:
    "Accidentados, recuperados y seminuevos con acompañamiento Auto Integral.",
};

export default async function VehiculosPage() {
  const { items } = await loadPublicVehicleList({ limit: 48 });

  return (
    <PublicShell
      eyebrow="Inventario"
      title="Vehículos"
      description="Unidades publicadas con información clara y contacto directo por WhatsApp."
    >
      <VehicleCategoryChips className="mt-5" />

      <div className="mt-8 hidden flex-wrap gap-3 text-sm md:flex">
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
        <div className="mt-6 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-5 py-10 text-center md:mt-10 md:px-6 md:py-14">
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
        <PublicVehicleGrid items={items} className="mt-5 md:mt-10" />
      )}
    </PublicShell>
  );
}
