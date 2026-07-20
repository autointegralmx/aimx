import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";

export type AutoCopySource = {
  make?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  category?: VehicleCategory | string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  body_type?: string | null;
  status?: string | null;
  damage_tags?: string[] | null;
  starts_status?: string | null;
  drives_status?: string | null;
  has_keys_status?: string | null;
  airbags_status?: string | null;
  invoice_type?: string | null;
  public_title?: string | null;
  short_description?: string | null;
  damage_summary?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  price_amount?: number | null;
  price_label?: string | null;
};

function titlePart(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed
    .split(/\s+/)
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

/** Public title from structure: Marca + Modelo + Versión (sin año). */
export function buildAutoPublicTitle(input: AutoCopySource): string {
  const parts = [
    titlePart(input.make),
    titlePart(input.model),
    titlePart(input.version),
  ].filter(Boolean);
  return parts.join(" ").slice(0, 160);
}

/** Objective summary phrases from operational / invoice fields. */
export function buildAutoSummaryPhrases(input: AutoCopySource): string[] {
  const phrases: string[] = [];
  switch (input.invoice_type) {
    case "aseguradora":
      phrases.push("Vehículo de aseguradora.");
      break;
    case "agencia":
      phrases.push("Factura de agencia.");
      break;
    case "empresa":
      phrases.push("Factura de empresa.");
      break;
    case "particular":
      phrases.push("Factura particular.");
      break;
    default:
      break;
  }
  if (input.starts_status === "yes") phrases.push("Arranca.");
  if (input.starts_status === "no") phrases.push("No arranca.");
  if (input.drives_status === "yes") phrases.push("Camina.");
  if (input.drives_status === "no") phrases.push("No camina.");
  if (input.has_keys_status === "yes") phrases.push("Con llaves.");
  if (input.has_keys_status === "no") phrases.push("Sin llaves.");
  if (input.airbags_status === "intact") phrases.push("Bolsas íntegras.");
  if (input.airbags_status === "deployed") phrases.push("Bolsas activadas.");
  if (input.airbags_status === "repaired") phrases.push("Bolsas reparadas.");
  return phrases;
}

/** One-line summary from confirmed structure only — never free-form marketing. */
export function buildAutoShortDescription(input: AutoCopySource): string {
  const identity = [titlePart(input.make), titlePart(input.model), input.year]
    .filter(Boolean)
    .join(" ");
  const bits = [
    input.transmission?.trim(),
    input.fuel_type?.trim(),
    input.body_type?.trim(),
  ].filter(Boolean);
  const phrases = buildAutoSummaryPhrases(input);
  const status =
    input.status === "available"
      ? "Disponible."
      : input.status === "reserved"
        ? "Apartado."
        : null;
  const parts = [
    identity ? `${identity}.` : null,
    bits.length ? `${bits.join(" · ")}.` : null,
    ...phrases,
    status,
  ].filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 280);
}

export function buildDamageSummaryFromTags(tags: string[] | null | undefined): string | null {
  const list = (tags ?? []).filter(Boolean);
  if (list.length === 0) return null;
  return list
    .map((tag) =>
      tag
        .replaceAll("_", " ")
        .replace(/\bdano\b/gi, "daño")
        .split(/\s+/)
        .map((word) =>
          word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word,
        )
        .join(" "),
    )
    .join(", ")
    .slice(0, 500);
}

export function buildAutoSeoTitle(input: AutoCopySource): string {
  const core = [
    input.make?.trim(),
    input.model?.trim(),
    input.version?.trim(),
    input.year ? String(input.year) : null,
  ]
    .filter(Boolean)
    .join(" ");
  const title = core ? `${core} | Auto Integral` : "Auto Integral";
  return title.slice(0, 70);
}

export function buildAutoSeoDescription(input: AutoCopySource): string {
  return buildAutoShortDescription(input).slice(0, 160);
}

/**
 * Always regenerate public copy from structured inventory fields.
 * Manual title/description/SEO/price_label are ignored (columns kept for DB compat).
 */
export function resolvePublicCopyFields(
  existing: AutoCopySource,
  patch: AutoCopySource,
): {
  public_title: string;
  short_description: string;
  damage_summary: string | null;
  seo_title: string;
  seo_description: string;
  price_label: string | null;
} {
  const merged: AutoCopySource = { ...existing, ...patch };
  const tags = patch.damage_tags ?? existing.damage_tags ?? [];
  const fromTags = buildDamageSummaryFromTags(tags);

  const amount =
    patch.price_amount !== undefined ? patch.price_amount : existing.price_amount;
  const hasPrice = amount != null && Number(amount) > 0;

  return {
    public_title: buildAutoPublicTitle(merged),
    short_description: buildAutoShortDescription(merged),
    damage_summary: fromTags,
    seo_title: buildAutoSeoTitle(merged),
    seo_description: buildAutoSeoDescription(merged),
    // Price label is derived in the UI from amount; never store free-form marketing.
    price_label: hasPrice ? null : null,
  };
}
