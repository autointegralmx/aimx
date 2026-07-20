import { CategoryPage } from "@/modules/content/ui/vehicle-category-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accidentados",
  description: "Vehículos accidentados con información clara y contacto directo.",
  alternates: { canonical: "/vehiculos/accidentados" },
};

export default function Page() {
  return <CategoryPage category="Accidentados" />;
}
