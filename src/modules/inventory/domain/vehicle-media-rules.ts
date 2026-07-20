export const MAX_VEHICLE_IMAGES = 30;
export const MAX_VEHICLE_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const VEHICLE_IMAGE_BUCKET = "vehicle-images";

export const ALLOWED_VEHICLE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AllowedVehicleImageMime =
  (typeof ALLOWED_VEHICLE_IMAGE_MIME_TYPES)[number];

const mimeToExt: Record<AllowedVehicleImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function isAllowedVehicleImageMime(
  mime: string,
): mime is AllowedVehicleImageMime {
  return (ALLOWED_VEHICLE_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function extensionForVehicleImageMime(
  mime: AllowedVehicleImageMime,
): string {
  return mimeToExt[mime];
}

export function validateVehicleImageFile(input: {
  mimeType: string;
  byteSize: number;
  currentCount: number;
  incomingCount?: number;
}): { ok: true } | { ok: false; error: string } {
  if (!isAllowedVehicleImageMime(input.mimeType)) {
    return {
      ok: false,
      error: "Formato no permitido. Usa JPEG, PNG, WebP o AVIF.",
    };
  }
  if (input.byteSize <= 0) {
    return { ok: false, error: "El archivo está vacío." };
  }
  if (input.byteSize > MAX_VEHICLE_IMAGE_BYTES) {
    return {
      ok: false,
      error: "La imagen supera el límite de 10 MB.",
    };
  }
  const incoming = input.incomingCount ?? 1;
  if (input.currentCount + incoming > MAX_VEHICLE_IMAGES) {
    return {
      ok: false,
      error: `Máximo ${MAX_VEHICLE_IMAGES} fotografías por vehículo.`,
    };
  }
  return { ok: true };
}

export function buildVehicleStorageObjectPath(
  vehicleId: string,
  assetId: string,
  mime: AllowedVehicleImageMime,
): string {
  return `vehicles/${vehicleId}/${assetId}.${extensionForVehicleImageMime(mime)}`;
}

export function isExpectedVehicleStorageObjectPath(input: {
  vehicleId: string;
  assetId: string;
  objectPath: string;
  mimeType: string;
}): boolean {
  if (!isAllowedVehicleImageMime(input.mimeType)) return false;
  return (
    input.objectPath ===
    buildVehicleStorageObjectPath(input.vehicleId, input.assetId, input.mimeType)
  );
}

export function publicStorageUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`;
}
