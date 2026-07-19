/**
 * WhatsApp contact helpers — number from env/settings only, never from free client input.
 */

const FALLBACK_WHATSAPP_DIGITS = "520000000000";

export function normalizeWhatsAppDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Resolves the configured business WhatsApp number.
 * Prefer NEXT_PUBLIC_WHATSAPP_NUMBER (UI) until settings are loaded from Supabase.
 */
export function getConfiguredWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.WHATSAPP_NUMBER?.trim() ||
    FALLBACK_WHATSAPP_DIGITS;
  const digits = normalizeWhatsAppDigits(raw);
  if (!digits) {
    throw new Error("WhatsApp number is not configured");
  }
  return digits;
}

export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const digits = normalizeWhatsAppDigits(phoneDigits);
  if (!digits) {
    throw new Error("Invalid WhatsApp number");
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Site-wide URL using the centrally configured number. */
export function buildSiteWhatsAppUrl(message: string): string {
  return buildWhatsAppUrl(getConfiguredWhatsAppDigits(), message);
}

export const whatsappMessages = {
  hero: "Hola, vi la página de Auto Integral y quiero recibir más información sobre los vehículos de aseguradora que pueden ayudarme a encontrar.",
  search:
    "Hola, quiero recibir más información para que me ayuden a encontrar un vehículo de aseguradora.",
  vehicles:
    "Hola, quiero recibir más información sobre los vehículos disponibles en Auto Integral.",
  accidentados:
    "Hola, quiero recibir más información sobre los vehículos accidentados disponibles.",
  recuperados:
    "Hola, quiero recibir más información sobre los vehículos recuperados disponibles.",
  seminuevos:
    "Hola, quiero recibir más información sobre los vehículos seminuevos disponibles.",
  opportunities:
    "Hola, quiero recibir más información sobre las oportunidades de vehículos seleccionadas esta semana.",
  services:
    "Hola, quiero recibir más información sobre los servicios automotrices de Auto Integral.",
  finalCta:
    "Hola, vi la página de Auto Integral y quiero recibir más información sobre los vehículos de aseguradora que pueden ayudarme a encontrar.",
} as const;

export function buildVehicleWhatsAppMessage(input: {
  year: string | number;
  make: string;
  model: string;
  version?: string | null;
  pageUrl?: string | null;
}): string {
  const label = [input.year, input.make, input.model, input.version]
    .filter(Boolean)
    .join(" ");
  const lines = [
    `Hola, quiero recibir más información sobre este vehículo: ${label}.`,
  ];
  if (input.pageUrl) {
    lines.push(`Ficha: ${input.pageUrl}`);
  }
  return lines.join(" ");
}

export function buildOpportunityWhatsAppMessage(input: {
  year: string | number;
  make: string;
  model: string;
  version?: string | null;
  pageUrl?: string | null;
}): string {
  const label = [input.year, input.make, input.model, input.version]
    .filter(Boolean)
    .join(" ");
  const lines = [
    `Hola, quiero recibir más información sobre esta oportunidad: ${label}.`,
  ];
  if (input.pageUrl) {
    lines.push(`Ficha: ${input.pageUrl}`);
  }
  return lines.join(" ");
}

export function buildServiceWhatsAppMessage(serviceName: string): string {
  return `Hola, quiero recibir más información sobre el servicio de ${serviceName}.`;
}

/** @deprecated Prefer contextual whatsappMessages + buildSiteWhatsAppUrl */
export function buildInventoryWhatsAppMessage(input: {
  publicReference: string;
  vehicleLabel: string;
  name: string;
}): string {
  return [
    `Hola Auto Integral, soy ${input.name}.`,
    `Me interesa el vehículo: ${input.vehicleLabel}.`,
    `Referencia: ${input.publicReference}.`,
  ].join(" ");
}
