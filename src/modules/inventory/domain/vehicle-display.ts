import type {
  AirbagsStatus,
  InvoiceType,
  TriState,
  VehicleCategory,
  VehicleStatus,
  VerificationStatus,
} from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

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
  if (label) return label;
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

/** Compact title: Marca + Modelo (ignores long marketing public_title). */
export function buildPublicHeadline(input: {
  make?: string | null;
  model?: string | null;
  public_title?: string | null;
}): string {
  const make = input.make?.trim();
  const model = input.model?.trim();
  if (make && model) return `${formatNamePart(make)} ${formatNamePart(model)}`;
  if (make) return formatNamePart(make);
  if (model) return formatNamePart(model);
  const fallback = input.public_title?.trim();
  return fallback ? shortenTitle(fallback) : "Vehículo";
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
  if (input.transmission?.trim()) parts.push(input.transmission.trim());
  if (input.body_type?.trim()) parts.push(input.body_type.trim());
  if (input.fuel_type?.trim()) parts.push(input.fuel_type.trim());
  if (input.version?.trim()) parts.push(input.version.trim());
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
  // Only show mileage when explicitly set (null/undefined = unknown — never invent 0 km).
  if (input.mileage_km != null) {
    cards.push({
      label: "Kilometraje",
      value: `${input.mileage_km.toLocaleString("es-MX")} km`,
    });
  }
  if (input.transmission?.trim()) {
    cards.push({ label: "Transmisión", value: input.transmission.trim() });
  }
  if (input.fuel_type?.trim()) {
    cards.push({ label: "Combustible", value: input.fuel_type.trim() });
  }
  if (input.exterior_color?.trim()) {
    cards.push({
      label: "Color",
      value: titleCaseWords(input.exterior_color.trim()),
    });
  }
  if (input.body_type?.trim()) {
    cards.push({ label: "Carrocería", value: input.body_type.trim() });
  }
  if (input.version?.trim()) {
    cards.push({ label: "Versión", value: input.version.trim() });
  }
  if (input.status === "available" || input.status === "reserved") {
    cards.push({
      label: "Estado",
      value: vehicleStatusLabel[input.status],
    });
  }
  const invoice = formatInvoiceTypeLabel(input.invoice_type);
  if (invoice) cards.push({ label: "Facturación", value: invoice });
  if (input.tenencias_label?.trim()) {
    cards.push({ label: "Tenencias", value: input.tenencias_label.trim() });
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
 * Objective badges only — never marketing public_tags.
 * Uses structured invoice data; insurance category is a historical fallback.
 */
export function buildObjectiveBadges(input: {
  category?: VehicleCategory | null;
  invoice_type?: InvoiceType | string | null;
  verification_status?: VerificationStatus | string | null;
  tenencias_label?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  body_type?: string | null;
  status?: VehicleStatus | null;
}): string[] {
  const badges: string[] = [];
  const invoice = input.invoice_type;
  if (invoice === "aseguradora") {
    badges.push("Factura de aseguradora");
  } else if (
    (invoice == null || invoice === "unknown") &&
    isInsuranceCategory(input.category)
  ) {
    // Historical fallback when invoice_type was never captured.
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
  if (input.tenencias_label?.trim()) {
    badges.push(`Tenencias ${input.tenencias_label.trim()}`);
  }
  return uniquePreserveOrder(badges);
}

/** Facts for the info card — only confirmed objective data. */
export function buildInfoFacts(input: {
  category?: VehicleCategory | null;
  status?: VehicleStatus | null;
  invoice_type?: InvoiceType | string | null;
  verification_status?: VerificationStatus | string | null;
  tenencias_label?: string | null;
  invoice_entity?: string | null;
}): string[] {
  const facts: string[] = [];
  const invoice = formatInvoiceTypeLabel(input.invoice_type);
  if (invoice) {
    facts.push(`Factura: ${invoice}`);
  } else if (isInsuranceCategory(input.category)) {
    facts.push("Vehículo de aseguradora");
  }
  if (input.invoice_entity?.trim()) {
    facts.push(`Refacturación: ${input.invoice_entity.trim()}`);
  }
  const verification = formatVerificationLabel(input.verification_status);
  if (verification) facts.push(`Verificación: ${verification}`);
  if (input.tenencias_label?.trim()) {
    facts.push(`Tenencias: ${input.tenencias_label.trim()}`);
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

/** Public observations: condition_notes only when allowed to publish. */
export function briefObservations(input: {
  condition_notes?: string | null;
  publish_observations?: boolean | null;
  /** @deprecated historical fallback only */
  damage_summary?: string | null;
}): string | null {
  if (input.publish_observations === false) return null;
  const note = input.condition_notes?.trim();
  if (note) {
    if (note.length > 140) return `${note.slice(0, 137).trimEnd()}…`;
    return note;
  }
  return null;
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
  category?: VehicleCategory | null;
  transmission?: string | null;
  fuel_type?: string | null;
  status?: VehicleStatus | null;
  damage_tags?: string[] | null;
  invoice_type?: InvoiceType | string | null;
}): string {
  const lines: string[] = [];
  const headline = [
    input.make?.trim(),
    input.model?.trim(),
    input.year ? String(input.year) : null,
  ]
    .filter(Boolean)
    .join(" ");
  if (headline) lines.push(`${headline}.`);
  if (
    input.invoice_type === "aseguradora" ||
    ((input.invoice_type == null || input.invoice_type === "unknown") &&
      isInsuranceCategory(input.category))
  ) {
    lines.push("Vehículo de aseguradora.");
  }
  if (input.transmission?.trim()) {
    lines.push(`Transmisión ${input.transmission.trim().toLowerCase()}.`);
  }
  if (input.fuel_type?.trim()) {
    lines.push(`Motor a ${input.fuel_type.trim().toLowerCase()}.`);
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
  const core = [input.make, input.model, input.version?.trim(), input.year]
    .filter(Boolean)
    .join(" ");
  return `${core} | Auto Integral`.slice(0, 70);
}

export function buildDefaultSeoDescription(input: {
  short_description?: string | null;
  year: number;
  make: string;
  model: string;
  category?: VehicleCategory | null;
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
    category: input.category,
    transmission: input.transmission,
    fuel_type: input.fuel_type,
    status: input.status,
    damage_tags: input.damage_tags,
    invoice_type: input.invoice_type,
  });
  if (structured.length >= 40) return structured.slice(0, 160);
  const base =
    input.short_description?.trim() ||
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

function isInsuranceCategory(category?: VehicleCategory | null): boolean {
  return category === "accidentado" || category === "recuperado";
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
