import { NosotrosPageView } from "@/modules/content/ui/nosotros-page";

export const metadata = {
  title: "Nosotros",
  description:
    "Más de 10 años ayudando a comprar vehículos de aseguradora de forma legal, segura y transparente. Asesoría profesional y oportunidades reales.",
  alternates: { canonical: "/nosotros" },
};

export default function NosotrosPage() {
  return <NosotrosPageView />;
}
