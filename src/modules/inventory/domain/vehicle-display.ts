import type {
  AirbagsStatus,
  InvoiceType,
  TriState,
  VehicleStatus,
  VerificationStatus,
} from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";
import {
  isUnknownMileage,
  isUnknownPublicValue,
} from "@/modules/inventory/domain/public-value";

export function formatPublicPrice(input: {
  price_amount?: number | null;
  price_label?: string | null;
  currency?: string | null;
}): string | null {
  const amount = input.price_amount;
  if (amount != null && Number(amount) > 0) {
    try {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: input.currency?.trim() || "MXN",
        maximumFractionDigits: 0,
      }).format(Number(amount));
    } catch {
      return `$${Number(amount).toLocaleString("es-MX")}`;
    }
  }

  const label = input.price_label?.trim();
  if (label && !isUnknownPublicValue(label)) return label;
  return null;
}

/** Detail page always shows a price string. */
export function formatDetailPrice(input: {
  price_amount?: number | null;
  price_label?: string | null;
  currency?: string | null;
}): string {
  return formatPublicPrice(input) ?? "Precio por confirmar";
}

/**
 * Compact title: Marca + Modelo (+ versión opcional).
 * Manual public_title only when useManualPublicCopy is true.
 */
export function buildPublicHeadline(input: {
  make?: string | null;
  model?: string | null;
  version?: string | null;
  public_title?: string | null;
  useManualPublicCopy?: boolean;
}): string {
  if (input.useManualPublicCopy) {
    const manual = input.public_title?.trim();
    if (manual && !isUnknownPublicValue(manual)) {
      return shortenTitle(manual);
    }
  }

  const make = cleanText(input.make);
  const model = cleanText(input.model);
  const version = cleanText(input.version);
  if (make && model) {
    const base = `${formatNamePart(make)} ${formatNamePart(model)}`;
    return version ? `${base} ${formatNamePart(version)}` : base;
  }
  if (make) return formatNamePart(make);
  if (model) return formatNamePart(model);
  return "Vehículo";
}

export function buildPublicSpecLine(input: {
  year?: number | null;
  transmission?: string | null;
  body_type?: string | null;
  fuel_type?: string | null;
  version?: string | null;
}): string[] {
  const parts: string[] = [];
  if (input.year) parts.push(String(input.year));
  const transmission = cleanText(input.transmission);
  const fuel = cleanText(input.fuel_type);
  const body = cleanText(input.body_type);
  if (transmission) parts.push(transmission);
  if (fuel) parts.push(fuel);
  if (body) parts.push(body);
  return parts;
}

export type SpecCard = { label: string; value: string };

export function buildPublicSpecCards(input: {
  year?: number | null;
  mileage_km?: number | null;
  transmission?: string | null;
  fuel_type?: string | null;
  exterior_color?: string | null;
  body_type?: string | null;
  version?: string | null;
  status?: VehicleStatus | null;
  invoice_type?: InvoiceType | string | null;
  tenencias_label?: string | null;
  verification_status?: VerificationStatus | string | null;
}): SpecCard[] {
  const cards: SpecCard[] = [];
  if (input.year) cards.push({ label: "Año", value: String(input.year) });

  // Always surface mileage: confirmed value or “Por confirmar” (never “0 km”).
  cards.push({
    label: "Kilometraje",
    value: isUnknownMileage(input.mileage_km)
      ? "Por confirmar"
      : `${Number(input.mileage_km).toLocaleString("es-MX")} km`,
  });

  const transmission = cleanText(input.transmission);
  if (transmission) {
    cards.push({ label: "Transmisión", value: transmission });
  }
  const fuel = cleanText(input.fuel_type);
  if (fuel) {
    cards.push({ label: "Combustible", value: fuel });
  }
  const color = cleanText(input.exterior_color);
  if (color) {
    cards.push({
      label: "Color",
      value: titleCaseWords(color),
    });
  }
  const body = cleanText(input.body_type);
  if (body) {
    cards.push({ label: "Carrocería", value: body });
  }
  const version = cleanText(input.version);
  if (version) {
    cards.push({ label: "Versión", value: version });
  }
  if (input.status === "available" || input.status === "reserved") {
    cards.push({
      label: "Estado",
      value: vehicleStatusLabel[input.status],
    });
  }
  const invoice = formatInvoiceTypeLabel(input.invoice_type);
  if (invoice) cards.push({ label: "Facturación", value: invoice });
  const tenencias = cleanText(input.tenencias_label);
  if (tenencias) {
    cards.push({ label: "Tenencias", value: tenencias });
  }
  const verification = formatVerificationLabel(input.verification_status);
  if (verification) {
    cards.push({ label: "Verificación", value: verification });
  }
  return cards;
}

/** Confirmed operational chips only (never show "por confirmar"). */
export function buildOperationalBadges(input: {
  starts_status?: TriState | string | null;
  drives_status?: TriState | string | null;
  has_keys_status?: TriState | string | null;
  airbags_status?: AirbagsStatus | string | null;
}): string[] {
  const badges: string[] = [];
  if (input.starts_status === "yes") badges.push("Arranca");
  if (input.starts_status === "no") badges.push("No arranca");
  if (input.drives_status === "yes") badges.push("Camina");
  if (input.drives_status === "no") badges.push("No camina");
  if (input.has_keys_status === "yes") badges.push("Con llaves");
  if (input.has_keys_status === "no") badges.push("Sin llaves");
  if (input.airbags_status === "intact") badges.push("Bolsas íntegras");
  if (input.airbags_status === "deployed") badges.push("Bolsas activadas");
  return badges;
}

/**
 * Objective documentation badges only — never marketing public_tags.
 * Never invents “aseguradora” from category.
 */
export function buildObjectiveBadges(input: {
  invoice_type?: InvoiceType | string | null;
  verification_status?: VerificationStatus | string | null;
  tenencias_label?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  body_type?: string | null;
  status?: VehicleStatus | null;
  /** @deprecated ignored — category must not invent invoice copy */
  category?: unknown;
}): string[] {
  const badges: string[] = [];
  const invoice = input.invoice_type;
  if (invoice === "aseguradora") {
    badges.push("Factura de aseguradora");
  } else if (invoice === "agencia") {
    badges.push("Factura de agencia");
  } else if (invoice === "empresa") {
    badges.push("Factura de empresa");
  } else if (invoice === "particular") {
    badges.push("Factura particular");
  }

  if (input.verification_status === "vigente") {
    badges.push("Verificación vigente");
  }
  const tenencias = cleanText(input.tenencias_label);
  if (tenencias) {
    badges.push(`Tenencias ${tenencias}`);
  }
  return uniquePreserveOrder(badges);
}

/** Facts for the info card — only confirmed objective data. */
export function buildInfoFacts(input: {
  status?: VehicleStatus | null;
  invoice_type?: InvoiceType | string | null;
  verification_status?: VerificationStatus | string | null;
  tenencias_label?: string | null;
  invoice_entity?: string | null;
  /** @deprecated ignored — category must not invent invoice copy */
  category?: unknown;
}): string[] {
  const facts: string[] = [];
  const invoice = formatInvoiceTypeLabel(input.invoice_type);
  if (invoice) {
    facts.push(`Factura: ${invoice}`);
  }
  const entity = cleanText(input.invoice_entity);
  if (entity) {
    facts.push(`Refacturación: ${entity}`);
  }
  const verification = formatVerificationLabel(input.verification_status);
  if (verification) facts.push(`Verificación: ${verification}`);
  const tenencias = cleanText(input.tenencias_label);
  if (tenencias) {
    facts.push(`Tenencias: ${tenencias}`);
  }
  if (input.status === "available") facts.push("Disponible");
  if (input.status === "reserved") facts.push("Reservado");
  return uniquePreserveOrder(facts);
}

export function formatDamageTagLabel(tag: string): string {
  return tag
    .replaceAll("_", " ")
    .replace(/\bdano\b/gi, "daño")
    .split(/\s+/)
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word,
    )
    .join(" ");
}

/** Public observations: only when non-empty (max 300). Empty = hidden. */
export function briefObservations(input: {
  condition_notes?: string | null;
  publish_observations?: boolean | null;
  /** @deprecated historical fallback only */
  damage_summary?: string | null;
}): string | null {
  if (input.publish_observations === false) return null;
  const note = input.condition_notes?.trim();
  if (!note || isUnknownPublicValue(note)) return null;
  return note.slice(0, 300);
}

/** @deprecated use briefObservations */
export function briefConditionNote(input: {
  damage_summary?: string | null;
  condition_notes?: string | null;
  publish_observations?: boolean | null;
}): string | null {
  return briefObservations(input);
}

export function buildStructuredPublicDescription(input: {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  transmission?: string | null;
  fuel_type?: string | null;
  status?: VehicleStatus | null;
  damage_tags?: string[] | null;
  invoice_type?: InvoiceType | string | null;
  starts_status?: string | null;
  drives_status?: string | null;
  has_keys_status?: string | null;
  airbags_status?: string | null;
  /** @deprecated ignored */
  category?: unknown;
}): string {
  const lines: string[] = [];
  const headline = [
    cleanText(input.make),
    cleanText(input.model),
    input.year ? String(input.year) : null,
  ]
    .filter(Boolean)
    .join(" ");
  if (headline) lines.push(`${headline}.`);
  if (input.invoice_type === "aseguradora") {
    lines.push("Vehículo de aseguradora.");
  } else if (input.invoice_type === "agencia") {
    lines.push("Factura de agencia.");
  } else if (input.invoice_type === "empresa") {
    lines.push("Factura de empresa.");
  } else if (input.invoice_type === "particular") {
    lines.push("Factura particular.");
  }
  if (input.starts_status === "yes") lines.push("Arranca.");
  if (input.starts_status === "no") lines.push("No arranca.");
  if (input.drives_status === "yes") lines.push("Camina.");
  if (input.drives_status === "no") lines.push("No camina.");
  if (input.has_keys_status === "yes") lines.push("Con llaves.");
  if (input.has_keys_status === "no") lines.push("Sin llaves.");
  if (input.airbags_status === "intact") lines.push("Bolsas íntegras.");
  if (input.airbags_status === "deployed") lines.push("Bolsas activadas.");
  const transmission = cleanText(input.transmission);
  if (transmission) {
    lines.push(`Transmisión ${transmission.toLowerCase()}.`);
  }
  const fuel = cleanText(input.fuel_type);
  if (fuel) {
    lines.push(`Motor a ${fuel.toLowerCase()}.`);
  }
  if (input.status === "available") lines.push("Disponible.");
  if (input.status === "reserved") lines.push("Reservado.");
  const tags = (input.damage_tags ?? []).filter(Boolean);
  if (tags.length > 0) {
    lines.push("Daños registrados:");
    for (const tag of tags) {
      lines.push(`• ${formatDamageTagLabel(tag)}`);
    }
  }
  return lines.join(" ").replace(/\s+/g, " ").trim().slice(0, 300);
}

export function buildDefaultSeoTitle(input: {
  year: number;
  make: string;
  model: string;
  version?: string | null;
  category?: string;
}): string {
  const core = [
    cleanText(input.make),
    cleanText(input.model),
    cleanText(input.version),
    input.year || null,
  ]
    .filter(Boolean)
    .join(" ");
  return `${core} | Auto Integral`.slice(0, 70);
}

export function buildDefaultSeoDescription(input: {
  short_description?: string | null;
  year: number;
  make: string;
  model: string;
  category?: unknown;
  transmission?: string | null;
  fuel_type?: string | null;
  status?: VehicleStatus | null;
  damage_tags?: string[] | null;
  invoice_type?: InvoiceType | string | null;
}): string {
  const structured = buildStructuredPublicDescription({
    make: input.make,
    model: input.model,
    year: input.year,
    transmission: input.transmission,
    fuel_type: input.fuel_type,
    status: input.status,
    damage_tags: input.damage_tags,
    invoice_type: input.invoice_type,
  });
  if (structured.length >= 40) return structured.slice(0, 160);
  const short = cleanText(input.short_description);
  const base =
    short ||
    `${input.year} ${input.make} ${input.model} disponible en Auto Integral.`;
  return base.slice(0, 160);
}

function formatInvoiceTypeLabel(
  value?: InvoiceType | string | null,
): string | null {
  switch (value) {
    case "aseguradora":
      return "Aseguradora";
    case "agencia":
      return "Agencia";
    case "empresa":
      return "Empresa";
    case "particular":
      return "Particular";
    default:
      return null;
  }
}

function formatVerificationLabel(
  value?: VerificationStatus | string | null,
): string | null {
  switch (value) {
    case "vigente":
      return "Vigente";
    case "no_vigente":
      return "No vigente";
    case "no_aplica":
      return "No aplica";
    default:
      return null;
  }
}

function cleanText(value?: string | null): string | null {
  if (isUnknownPublicValue(value)) return null;
  return value!.trim();
}

function formatNamePart(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      if (/[0-9]/.test(word) || /^[A-Za-z]{2,3}$/.test(word)) {
        return word.toUpperCase();
      }
      return titleCaseWords(word);
    })
    .join(" ");
}

function titleCaseWords(value: string): string {
  return value
    .toLowerCase()
    .split("-")
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    )
    .join("-");
}

function shortenTitle(value: string): string {
  const cleaned = value.split("|")[0]?.trim() || value.trim();
  return cleaned.length > 48 ? `${cleaned.slice(0, 45).trimEnd()}…` : cleaned;
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}
