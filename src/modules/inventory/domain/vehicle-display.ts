import type {
  VehicleCategory,
  VehicleStatus,
} from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

export function formatPublicPrice(input: {
  price_amount?: number | null;
  price_label?: string | null;
  currency?: string | null;
}): string | null {
  const label = input.price_label?.trim();
  if (label) return label;

  const amount = input.price_amount;
  if (amount == null || Number(amount) <= 0) return null;

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
}): SpecCard[] {
  const cards: SpecCard[] = [];
  if (input.year) cards.push({ label: "Año", value: String(input.year) });
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
  return cards;
}

/** Objective badges only — never marketing public_tags. Specs live in cards. */
export function buildObjectiveBadges(input: {
  category?: VehicleCategory | null;
  transmission?: string | null;
  fuel_type?: string | null;
  body_type?: string | null;
  status?: VehicleStatus | null;
}): string[] {
  const badges: string[] = [];
  if (isInsuranceCategory(input.category)) {
    badges.push("Factura de aseguradora");
    badges.push("Vehículo legal");
  }
  return uniquePreserveOrder(badges);
}

export function buildInfoFacts(input: {
  category?: VehicleCategory | null;
  status?: VehicleStatus | null;
}): string[] {
  const facts: string[] = [];
  if (isInsuranceCategory(input.category)) {
    facts.push("Vehículo de aseguradora");
    facts.push("Facturación disponible");
    facts.push("Documentación legal");
  } else if (input.category === "seminuevo") {
    facts.push("Documentación legal");
  }
  if (input.status === "available") facts.push("Disponible");
  if (input.status === "reserved") facts.push("Reservado");
  return uniquePreserveOrder(facts);
}

export function formatDamageTagLabel(tag: string): string {
  return tag
    .replaceAll("_", " ")
    .replace(/\bdano\b/gi, "daño")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function briefConditionNote(input: {
  damage_summary?: string | null;
  condition_notes?: string | null;
}): string | null {
  const candidates = [input.damage_summary, input.condition_notes]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
  if (candidates.length === 0) return null;
  // Prefer the shortest factual note (avoid long paragraphs).
  const sorted = [...candidates].sort((a, b) => a.length - b.length);
  const note = sorted[0]!;
  if (note.length > 140) return `${note.slice(0, 137).trimEnd()}…`;
  return note;
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
  if (isInsuranceCategory(input.category)) {
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
  category: string;
}): string {
  return `${input.year} ${input.make} ${input.model} · ${input.category}`.slice(
    0,
    70,
  );
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
  });
  if (structured.length >= 40) return structured.slice(0, 160);
  const base =
    input.short_description?.trim() ||
    `${input.year} ${input.make} ${input.model} disponible en Auto Integral.`;
  return base.slice(0, 160);
}

function isInsuranceCategory(category?: VehicleCategory | null): boolean {
  return category === "accidentado" || category === "recuperado";
}

function formatNamePart(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      // Keep model codes with digits (MX-5) or short trim codes (GTI, LE).
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
