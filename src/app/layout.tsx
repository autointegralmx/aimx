import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { getSiteOrigin } from "@/shared/config/site";
import "@/styles/tokens.css";

const title =
  "Auto Integral | Vehículos de aseguradora y oportunidades seleccionadas";
const description =
  "Encuentra vehículos de aseguradora con asesoría personalizada. Tenemos acceso a la subastadora de vehículos de aseguradora más grande del país y te acompañamos durante todo el proceso.";

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
