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
      eyebrow="Vehículos"
      title={category}
      description={`Explora vehículos ${category.toLowerCase()} con información clara y acompañamiento directo.`}
    >
      <VehicleCategoryChips className="mt-5" />

      {items.length === 0 ? (
        <div className="mt-6 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-5 py-10 text-center md:mt-10 md:px-6 md:py-14">
          <h2 className="text-lg font-bold uppercase tracking-wide text-text-primary md:text-xl">
            Sin unidades publicadas
          </h2>
          <p className="mt-3 text-[16px] text-text-secondary">
            Por ahora no hay vehículos en esta categoría. Escríbenos y te
            ayudamos a buscar.
          </p>
          <WhatsAppCta message={message} className="mt-6 inline-flex" />
        </div>
      ) : (
        <>
          <PublicVehicleGrid
            items={items}
            listMode="all"
            className="mt-5 md:mt-10"
          />
          <div className="mt-8 md:mt-10">
            <WhatsAppCta message={message} />
          </div>
        </>
      )}
      <p className="mt-6 text-sm md:mt-8">
        <Link href="/vehiculos" className="text-brand-red hover:underline">
          Ver todas las categorías
        </Link>
      </p>
    </PublicShell>
  );
}
