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
  const { items } = await loadPublicVehicleList({ mode: "all" });

  return (
    <PublicShell
      variant="compact"
      eyebrow="Vehículos disponibles"
      title="Explora las oportunidades actuales."
      description="Unidades accidentadas, recuperadas y seminuevas seleccionadas."
    >
      <VehicleCategoryChips className="mt-1" />

      {items.length === 0 ? (
        <div className="mt-8 border border-dashed border-border-subtle bg-surface-secondary px-5 py-12 text-center">
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
        <PublicVehicleGrid
          items={items}
          listMode="all"
          className="mt-6 md:mt-8"
        />
      )}
    </PublicShell>
  );
}
