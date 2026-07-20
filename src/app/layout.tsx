import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { getShareImageUrl, getSiteOrigin } from "@/shared/config/site";
import "@/styles/tokens.css";

const title =
  "Auto Integral | Vehículos de aseguradora, autopartes y servicios";
const description =
  "Vehículos de aseguradora, accidentados, recuperados y seminuevos. Atención personalizada en CDMX y Estado de México, con envíos a toda la República.";

const siteOrigin = getSiteOrigin();
const shareImage = getShareImageUrl("/og-share.png");

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
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/brand/logo-autointegral.png", type: "image/png" },
    ],
    apple: [{ url: "/brand/logo-autointegral.png", type: "image/png", sizes: "180x180" }],
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
        url: shareImage,
        secureUrl: shareImage,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Auto Integral — vehículos de aseguradora y seminuevos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
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
