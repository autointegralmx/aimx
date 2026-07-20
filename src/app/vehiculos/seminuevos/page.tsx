import { CategoryPage } from "@/modules/content/ui/vehicle-category-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seminuevos",
  description: "Vehículos seminuevos con información clara y contacto directo.",
  alternates: { canonical: "/vehiculos/seminuevos" },
};

export default function Page() {
  return <CategoryPage category="Seminuevos" />;
}
