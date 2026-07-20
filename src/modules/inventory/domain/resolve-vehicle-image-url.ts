import { publicStorageUrl } from "@/modules/inventory/domain/vehicle-media-rules";

export const VEHICLE_IMAGE_VARIANTS = [
  "thumb",
  "card",
  "medium",
  "large",
  "original",
] as const;

export type VehicleImageVariant = (typeof VEHICLE_IMAGE_VARIANTS)[number];

/** Cloudinary named transforms — no physical derivative files. */
export const VEHICLE_IMAGE_TRANSFORM: Record<VehicleImageVariant, string> = {
  thumb: "c_fill,w_400,h_300,g_auto,f_auto,q_auto",
  card: "c_fill,w_720,h_540,g_auto,f_auto,q_auto",
  medium: "c_limit,w_1200,f_auto,q_auto",
  large: "c_limit,w_1800,f_auto,q_auto",
  original: "f_auto,q_auto",
};

export type ResolvableVehicleMediaAsset = {
  provider?: string | null;
  public_id?: string | null;
  version?: number | null;
  format?: string | null;
  /** Informational only — never used as primary delivery source for Cloudinary. */
  secure_url?: string | null;
  bucket?: string | null;
  object_path?: string | null;
};

export type ResolveVehicleImageUrlOptions = {
  cloudName?: string | null;
  supabaseUrl?: string | null;
};

/**
 * Central dual-provider image URL builder.
 * Cloudinary: always from public_id (+ optional version/format).
 * Supabase legacy: public Storage URL from bucket + object_path.
 */
export function resolveVehicleImageUrl(
  asset: ResolvableVehicleMediaAsset,
  variant: VehicleImageVariant = "card",
  options: ResolveVehicleImageUrlOptions = {},
): string | null {
  const provider = (asset.provider ?? "supabase").trim().toLowerCase();

  if (provider === "cloudinary") {
    return buildCloudinaryDeliveryUrl(asset, variant, options.cloudName);
  }

  if (provider === "supabase") {
    if (!asset.bucket?.trim() || !asset.object_path?.trim()) return null;
    if (!options.supabaseUrl?.trim()) return null;
    return publicStorageUrl(
      options.supabaseUrl,
      asset.bucket.trim(),
      asset.object_path.trim(),
    );
  }

  return null;
}

function buildCloudinaryDeliveryUrl(
  asset: ResolvableVehicleMediaAsset,
  variant: VehicleImageVariant,
  cloudName: string | null | undefined,
): string | null {
  const publicId = asset.public_id?.trim();
  if (!publicId) return null;
  const name = cloudName?.trim();
  if (!name) return null;

  // Reject arbitrary absolute URLs slipped into public_id.
  if (/^https?:\/\//i.test(publicId) || publicId.includes("://")) {
    return null;
  }

  const transform = VEHICLE_IMAGE_TRANSFORM[variant];
  const versionSegment =
    asset.version != null && Number.isInteger(asset.version) && asset.version > 0
      ? `v${asset.version}/`
      : "";

  // With f_auto in transform, omit format extension; still allow format when present
  // for cache-friendly paths without relying on secure_url.
  const format = asset.format?.trim().replace(/^\./, "").toLowerCase();
  const formatSuffix =
    format && /^[a-z0-9]+$/.test(format) && !publicId.includes(".")
      ? `.${format}`
      : "";

  const encodedPublicId = encodeCloudinaryPublicId(publicId);
  return `https://res.cloudinary.com/${encodeURIComponent(name)}/image/upload/${transform}/${versionSegment}${encodedPublicId}${formatSuffix}`;
}

/** Encode each path segment; keep folder separators as `/`. */
export function encodeCloudinaryPublicId(publicId: string): string {
  return publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
