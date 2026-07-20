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
  public_title?: string | null;
  short_description?: string | null;
  damage_summary?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  price_amount?: number | null;
  price_label?: string | null;
};

/** Public title from structure: MAKE MODEL VERSION YEAR */
export function buildAutoPublicTitle(input: AutoCopySource): string {
  const parts = [
    input.make?.trim().toUpperCase(),
    input.model?.trim().toUpperCase(),
    input.version?.trim(),
    input.year ? String(input.year) : null,
  ].filter(Boolean);
  return parts.join(" ").slice(0, 160);
}

/** One-line commercial summary from confirmed structure only. */
export function buildAutoShortDescription(input: AutoCopySource): string {
  const bits = [
    input.transmission?.trim(),
    input.fuel_type?.trim(),
    input.body_type?.trim(),
  ].filter(Boolean);
  const identity = [input.make?.trim(), input.model?.trim(), input.year]
    .filter(Boolean)
    .join(" ");
  const status =
    input.status === "available"
      ? "Disponible"
      : input.status === "reserved"
        ? "Reservado"
        : null;
  const sentence = [identity, bits.length ? bits.join(" · ") : null, status]
    .filter(Boolean)
    .join(". ");
  return `${sentence}.`.replace(/\.\./g, ".").slice(0, 280);
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
 * Fill missing public copy from structure. Never overwrites non-empty
 * historical values (compatibility). Regenerates damage_summary from tags
 * when tags are present.
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

  const publicTitle =
    nonEmpty(patch.public_title) ??
    nonEmpty(existing.public_title) ??
    buildAutoPublicTitle(merged);

  const shortDescription =
    nonEmpty(patch.short_description) ??
    nonEmpty(existing.short_description) ??
    buildAutoShortDescription(merged);

  const damageSummary =
    fromTags ??
    nonEmpty(patch.damage_summary) ??
    nonEmpty(existing.damage_summary) ??
    null;

  const seoTitle =
    nonEmpty(patch.seo_title) ??
    nonEmpty(existing.seo_title) ??
    buildAutoSeoTitle(merged);

  const seoDescription =
    nonEmpty(patch.seo_description) ??
    nonEmpty(existing.seo_description) ??
    buildAutoSeoDescription(merged);

  const amount = patch.price_amount !== undefined
    ? patch.price_amount
    : existing.price_amount;
  const hasPrice = amount != null && Number(amount) > 0;
  const priceLabel = hasPrice
    ? null
    : nonEmpty(patch.price_label) ??
      nonEmpty(existing.price_label) ??
      null;

  return {
    public_title: publicTitle,
    short_description: shortDescription,
    damage_summary: damageSummary,
    seo_title: seoTitle,
    seo_description: seoDescription,
    price_label: priceLabel,
  };
}

function nonEmpty(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
