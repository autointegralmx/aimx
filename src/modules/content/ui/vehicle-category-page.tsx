import Link from "next/link";
import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import { loadPublicVehicleList } from "@/modules/inventory/application/public-queries";
import { PublicVehicleGrid } from "@/modules/inventory/ui/public-vehicle-grid";
import { VehicleCategoryChips } from "@/modules/inventory/ui/vehicle-category-chips";
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
  const { items } = dbCategory
    ? await loadPublicVehicleList({ category: dbCategory, mode: "all" })
    : { items: [] };

  return (
    <PublicShell
      variant="compact"
      eyebrow="Vehículos"
      title={category}
      description={`Unidades ${category.toLowerCase()} con información clara y acompañamiento directo.`}
    >
      <VehicleCategoryChips className="mt-1" />

      {items.length === 0 ? (
        <div className="mt-8 border border-dashed border-border-subtle bg-surface-secondary px-5 py-12 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">
            Sin unidades publicadas
          </h2>
          <p className="mt-3 text-[15px] text-text-secondary">
            Por ahora no hay vehículos en esta categoría. Escríbenos y te
            ayudamos a buscar.
          </p>
          <WhatsAppCta message={message} className="mt-6 inline-flex" />
        </div>
      ) : (
        <PublicVehicleGrid
          items={items}
          listMode="all"
          className="mt-6 md:mt-8"
        />
      )}
      <p className="mt-8 text-sm">
        <Link href="/vehiculos" className="link-editorial">
          Ver todas las categorías →
        </Link>
      </p>
    </PublicShell>
  );
}
