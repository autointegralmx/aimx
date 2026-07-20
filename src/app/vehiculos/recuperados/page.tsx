import { CategoryPage } from "@/modules/content/ui/vehicle-category-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recuperados",
  description: "Vehículos recuperados con información clara y contacto directo.",
  alternates: { canonical: "/vehiculos/recuperados" },
};

export default function Page() {
  return <CategoryPage category="Recuperados" />;
}
