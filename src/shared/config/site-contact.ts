/**
 * Public contact and social profiles for Auto Integral.
 * Keep URLs and display values here — UI should not hardcode them.
 */
export const siteContact = {
  whatsappDisplay: "+52 55 1474 5677",
  whatsappDigits: "525514745677",
  email: "autointegralmx@gmail.com",
  location: "CDMX y Área Metropolitana",
  hours: "Lun–Sáb · 10:00–19:00",
} as const;

export const siteSocial = [
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@autointegralmx",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/autointegralmx",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/autointegralmx",
  },
] as const;

export type SiteSocialId = (typeof siteSocial)[number]["id"];
