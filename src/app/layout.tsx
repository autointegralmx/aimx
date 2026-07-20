import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { getSiteOrigin } from "@/shared/config/site";
import "@/styles/tokens.css";

const title =
  "Auto Integral | Vehículos de aseguradora, autopartes y servicios";
const description =
  "Vehículos de aseguradora, accidentados, recuperados y seminuevos. Atención personalizada en CDMX y Estado de México, con envíos a toda la República.";

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: title,
    template: "%s | Auto Integral",
  },
  description,
  applicationName: "Auto Integral",
  authors: [{ name: "Auto Integral" }],
  keywords: [
    "Auto Integral",
    "vehículos de aseguradora",
    "seminuevos",
    "accidentados",
    "recuperados",
    "autopartes",
    "CDMX",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/brand/logo-autointegral.png", type: "image/png" }],
    apple: [{ url: "/brand/logo-autointegral.png", type: "image/png" }],
  },
  openGraph: {
    title,
    description,
    url: siteOrigin,
    siteName: "Auto Integral",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Auto Integral — vehículos de aseguradora y seminuevos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
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
