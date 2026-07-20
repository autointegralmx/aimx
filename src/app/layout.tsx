import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { getSiteOrigin } from "@/shared/config/site";
import "@/styles/tokens.css";

const title =
  "Auto Integral | Vehículos de aseguradora, autopartes y servicios automotrices";
const description =
  "Encuentra vehículos de aseguradora, autopartes y servicios automotrices con atención personalizada. Contamos con una amplia red de distribuidores en CDMX y Estado de México y realizamos envíos a toda la República Mexicana.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: title,
    template: "%s | Auto Integral",
  },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={GeistSans.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
