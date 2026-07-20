/**
 * Domain rules for dual-provider media assets (Supabase Storage | Cloudinary).
 * Phase 1: schema validation only — upload/UI still use Supabase.
 */

export const MEDIA_PROVIDERS = ["supabase", "cloudinary"] as const;
export type MediaProvider = (typeof MEDIA_PROVIDERS)[number];

export const CLOUDINARY_RESOURCE_TYPES = [
  "image",
  "video",
  "raw",
  "auto",
] as const;
export type CloudinaryResourceType =
  (typeof CLOUDINARY_RESOURCE_TYPES)[number];

export type MediaAssetProviderFields = {
  provider: MediaProvider;
  bucket?: string | null;
  object_path?: string | null;
  public_id?: string | null;
  resource_type?: string | null;
  version?: number | null;
  secure_url?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  byte_size?: number | null;
};

export type MediaAssetProviderValidation =
  | { ok: true }
  | { ok: false; error: string };

export function isMediaProvider(value: unknown): value is MediaProvider {
  return (
    typeof value === "string" &&
    (MEDIA_PROVIDERS as readonly string[]).includes(value)
  );
}

/**
 * Mirrors the SQL check constraints for dual-provider rows.
 * Legacy Supabase rows: bucket + object_path required.
 * Cloudinary rows: public_id required; delivery builds from public_id.
 */
export function validateMediaAssetProviderFields(
  input: MediaAssetProviderFields,
): MediaAssetProviderValidation {
  if (!isMediaProvider(input.provider)) {
    return { ok: false, error: "provider debe ser supabase o cloudinary." };
  }

  if (input.provider === "supabase") {
    if (!input.bucket?.trim() || !input.object_path?.trim()) {
      return {
        ok: false,
        error: "Assets supabase requieren bucket y object_path.",
      };
    }
    return { ok: true };
  }

  if (!input.public_id?.trim()) {
    return {
      ok: false,
      error: "Assets cloudinary requieren public_id.",
    };
  }

  if (
    input.resource_type != null &&
    input.resource_type !== "" &&
    !(CLOUDINARY_RESOURCE_TYPES as readonly string[]).includes(
      input.resource_type,
    )
  ) {
    return {
      ok: false,
      error: "resource_type de Cloudinary inválido.",
    };
  }

  if (input.version != null && (!Number.isInteger(input.version) || input.version < 1)) {
    return { ok: false, error: "version debe ser un entero positivo." };
  }

  if (input.width != null && input.width <= 0) {
    return { ok: false, error: "width debe ser positivo." };
  }
  if (input.height != null && input.height <= 0) {
    return { ok: false, error: "height debe ser positivo." };
  }
  if (input.byte_size != null && input.byte_size <= 0) {
    return { ok: false, error: "byte_size debe ser positivo." };
  }

  return { ok: true };
}
