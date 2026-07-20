import { getSiteOrigin } from "@/shared/config/site";

export default function sitemap() {
  const origin = getSiteOrigin();
  const paths = [
    "/",
    "/vehiculos",
    "/vehiculos/accidentados",
    "/vehiculos/recuperados",
    "/vehiculos/seminuevos",
    "/subastas",
    "/servicios",
    "/como-comprar",
    "/nosotros",
    "/contacto",
  ];

  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
