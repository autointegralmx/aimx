/**
 * Stable Cloudinary path identity for vehicle images.
 * Uses vehicleId + assetId (UUIDs), never slug.
 */

export const CLOUDINARY_VEHICLE_ROOT_FOLDER = "CarrosAutointegral/vehicles";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Folder for signed upload: CarrosAutointegral/vehicles/{vehicleId} */
export function buildCloudinaryVehicleFolder(vehicleId: string): string {
  if (!isUuid(vehicleId)) {
    throw new Error("vehicleId inválido.");
  }
  return `${CLOUDINARY_VEHICLE_ROOT_FOLDER}/${vehicleId}`;
}

/**
 * Leaf public_id sent to Cloudinary upload API (with folder param).
 * Final resource identity = folder/assetId.
 */
export function buildCloudinaryUploadPublicIdLeaf(assetId: string): string {
  if (!isUuid(assetId)) {
    throw new Error("assetId inválido.");
  }
  return assetId;
}

/** Full public_id used for delivery and DB: CarrosAutointegral/vehicles/{vehicleId}/{assetId} */
export function buildCloudinaryVehiclePublicId(
  vehicleId: string,
  assetId: string,
): string {
  return `${buildCloudinaryVehicleFolder(vehicleId)}/${buildCloudinaryUploadPublicIdLeaf(assetId)}`;
}

export function isExpectedCloudinaryVehiclePublicId(input: {
  vehicleId: string;
  assetId: string;
  publicId: string;
}): boolean {
  try {
    return (
      input.publicId ===
      buildCloudinaryVehiclePublicId(input.vehicleId, input.assetId)
    );
  } catch {
    return false;
  }
}

export function parseCloudinaryVehiclePublicId(publicId: string): {
  vehicleId: string;
  assetId: string;
} | null {
  const prefix = `${CLOUDINARY_VEHICLE_ROOT_FOLDER}/`;
  if (!publicId.startsWith(prefix)) return null;
  const rest = publicId.slice(prefix.length);
  const parts = rest.split("/");
  if (parts.length !== 2) return null;
  const [vehicleId, assetId] = parts;
  if (!vehicleId || !assetId || !isUuid(vehicleId) || !isUuid(assetId)) {
    return null;
  }
  return { vehicleId, assetId };
}
