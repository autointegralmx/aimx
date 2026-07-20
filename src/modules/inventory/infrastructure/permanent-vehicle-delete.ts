import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/database.types";
import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";
import { VEHICLE_IMAGE_BUCKET } from "@/modules/inventory/domain/vehicle-media-rules";
import { writeAuditEvent } from "@/modules/inventory/infrastructure/audit";
import { destroyCloudinaryAsset } from "@/shared/lib/cloudinary/destroy";
import { logCloudinaryServerError } from "@/shared/lib/cloudinary/server";

export type InventoryDeleteClient = SupabaseClient<Database>;

export type StorageObjectRef = {
  bucket: string;
  object_path: string;
};

export type CloudinaryObjectRef = {
  public_id: string;
  resource_type: string;
};

export type PermanentVehicleDeleteResult = {
  vehicleId: string;
  slug: string;
  category: VehicleCategory;
  make: string;
  model: string;
  year: number;
  stockCode: string | null;
  mediaAssetCount: number;
  storageRemoved: StorageObjectRef[];
  storagePending: StorageObjectRef[];
  cloudinaryRemoved: CloudinaryObjectRef[];
  cloudinaryPending: CloudinaryObjectRef[];
  storageError: string | null;
};

export type PermanentDeleteStage =
  | "authorize"
  | "load_vehicle"
  | "list_media"
  | "audit"
  | "delete_vehicle"
  | "delete_media_assets"
  | "delete_storage"
  | "delete_cloudinary"
  | "verify";

export class PermanentDeleteError extends Error {
  readonly stage: PermanentDeleteStage;
  readonly vehicleId: string | null;
  readonly supabaseCode: string | null;
  readonly storagePending: StorageObjectRef[];

  constructor(input: {
    message: string;
    stage: PermanentDeleteStage;
    vehicleId?: string | null;
    cause?: unknown;
    supabaseCode?: string | null;
    storagePending?: StorageObjectRef[];
  }) {
    super(input.message);
    this.name = "PermanentDeleteError";
    this.stage = input.stage;
    this.vehicleId = input.vehicleId ?? null;
    this.supabaseCode = input.supabaseCode ?? null;
    this.storagePending = input.storagePending ?? [];
    if (input.cause instanceof Error && input.cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${input.cause.stack}`;
    }
  }
}

/**
 * Hard-delete a vehicle and its media.
 *
 * Strategy (Postgres + Storage are not one transaction):
 * 1. Collect media paths while the vehicle still exists.
 * 2. Write audit snapshot.
 * 3. DELETE vehicles row → vehicle_media cascades; leads.vehicle_id SET NULL.
 * 4. DELETE orphaned media_assets rows.
 * 5. Remove Storage objects; on failure return partial success with pending paths.
 *
 * Preserved intentionally:
 * - leads (vehicle_id nullified)
 * - audit_events (history retained)
 */
export async function deleteVehiclePermanently(
  client: InventoryDeleteClient,
  input: { vehicleId: string; actorId: string },
): Promise<PermanentVehicleDeleteResult> {
  const vehicleId = input.vehicleId;

  const { data: vehicle, error: loadError } = await client
    .from("vehicles")
    .select(
      "id, slug, category, make, model, year, stock_code, status, is_published, is_featured, is_weekly_opportunity",
    )
    .eq("id", vehicleId)
    .maybeSingle();

  if (loadError) {
    throw new PermanentDeleteError({
      message: "No se pudo leer el vehículo.",
      stage: "load_vehicle",
      vehicleId,
      supabaseCode: loadError.code,
      cause: loadError,
    });
  }
  if (!vehicle) {
    throw new PermanentDeleteError({
      message: "El vehículo no existe.",
      stage: "load_vehicle",
      vehicleId,
    });
  }

  const { data: mediaRows, error: mediaError } = await client
    .from("vehicle_media")
    .select(
      "media_asset_id, media_assets ( id, provider, bucket, object_path, public_id, resource_type, deleted_at )",
    )
    .eq("vehicle_id", vehicleId);

  if (mediaError) {
    throw new PermanentDeleteError({
      message: "No se pudieron listar las fotografías del vehículo.",
      stage: "list_media",
      vehicleId,
      supabaseCode: mediaError.code,
      cause: mediaError,
    });
  }

  const mediaAssetIds: string[] = [];
  const storageTargets: StorageObjectRef[] = [];
  const cloudinaryTargets: CloudinaryObjectRef[] = [];
  const seenPaths = new Set<string>();
  const seenPublicIds = new Set<string>();

  for (const row of mediaRows ?? []) {
    mediaAssetIds.push(row.media_asset_id);
    const asset = row.media_assets;
    if (!asset || Array.isArray(asset)) continue;
    const provider = (asset.provider ?? "supabase").toLowerCase();
    if (provider === "cloudinary" && asset.public_id) {
      if (seenPublicIds.has(asset.public_id)) continue;
      seenPublicIds.add(asset.public_id);
      cloudinaryTargets.push({
        public_id: asset.public_id,
        resource_type: asset.resource_type || "image",
      });
      continue;
    }
    if (!asset.bucket || !asset.object_path) continue;
    const key = `${asset.bucket}:${asset.object_path}`;
    if (seenPaths.has(key)) continue;
    seenPaths.add(key);
    storageTargets.push({
      bucket: asset.bucket,
      object_path: asset.object_path,
    });
  }

  try {
    await writeAuditEvent(client, {
      actorId: input.actorId,
      action: "delete_vehicle_permanently",
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: {
        slug: vehicle.slug,
        category: vehicle.category,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
        is_published: vehicle.is_published,
        is_featured: vehicle.is_featured,
        is_weekly_opportunity: vehicle.is_weekly_opportunity,
        media_asset_count: mediaAssetIds.length,
        storage_path_count: storageTargets.length,
        cloudinary_count: cloudinaryTargets.length,
        cloudinary_public_ids: cloudinaryTargets.map((item) => item.public_id),
      },
    });
  } catch (error) {
    throw new PermanentDeleteError({
      message: "No se pudo registrar la auditoría previa al borrado.",
      stage: "audit",
      vehicleId,
      cause: error,
    });
  }

  // Destroy Cloudinary before dropping DB rows so public_ids stay recoverable in audit.
  const cloudinaryRemoved: CloudinaryObjectRef[] = [];
  const cloudinaryPending: CloudinaryObjectRef[] = [];
  for (const target of cloudinaryTargets) {
    const destroyed = await destroyCloudinaryAsset({
      publicId: target.public_id,
      resourceType: target.resource_type,
    });
    if (destroyed.ok) {
      cloudinaryRemoved.push(target);
    } else {
      cloudinaryPending.push(target);
      logCloudinaryServerError(
        "delete_vehicle_permanently.cloudinary",
        new Error(destroyed.error),
        { publicId: target.public_id, vehicleId },
      );
    }
  }

  const { data: deletedRows, error: deleteVehicleError } = await client
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .select("id");

  if (deleteVehicleError) {
    throw new PermanentDeleteError({
      message: "No se pudo eliminar el vehículo en la base de datos.",
      stage: "delete_vehicle",
      vehicleId,
      supabaseCode: deleteVehicleError.code,
      cause: deleteVehicleError,
      storagePending: storageTargets,
    });
  }

  // RLS without a DELETE policy returns success with 0 rows.
  if (!deletedRows?.length) {
    throw new PermanentDeleteError({
      message:
        "No se pudo eliminar el vehículo: falta permiso de borrado en la base de datos.",
      stage: "delete_vehicle",
      vehicleId,
      supabaseCode: "42501",
      storagePending: storageTargets,
    });
  }

  let mediaAssetsError: string | null = null;
  if (mediaAssetIds.length > 0) {
    const { error: deleteAssetsError } = await client
      .from("media_assets")
      .delete()
      .in("id", mediaAssetIds);

    if (deleteAssetsError) {
      // Vehicle row is already gone; surface as partial cleanup needed.
      mediaAssetsError = deleteAssetsError.message;
      console.error("[delete_vehicle_permanently] media_assets_partial", {
        vehicleId,
        stage: "delete_media_assets",
        message: deleteAssetsError.message,
        code: deleteAssetsError.code,
        mediaAssetIds,
      });
    }
  }

  const folderExtras = await listStorageFolderObjects(
    client,
    VEHICLE_IMAGE_BUCKET,
    `vehicles/${vehicleId}`,
  );
  for (const objectPath of folderExtras) {
    const key = `${VEHICLE_IMAGE_BUCKET}:${objectPath}`;
    if (seenPaths.has(key)) continue;
    seenPaths.add(key);
    storageTargets.push({
      bucket: VEHICLE_IMAGE_BUCKET,
      object_path: objectPath,
    });
  }

  const storageRemoved: StorageObjectRef[] = [];
  const storagePending: StorageObjectRef[] = [];
  let storageError: string | null = mediaAssetsError;
  if (cloudinaryPending.length > 0) {
    storageError =
      storageError ??
      `Cloudinary: ${cloudinaryPending.length} recurso(s) pendientes de limpieza.`;
  }

  const byBucket = new Map<string, string[]>();
  for (const target of storageTargets) {
    const list = byBucket.get(target.bucket) ?? [];
    list.push(target.object_path);
    byBucket.set(target.bucket, list);
  }

  for (const [bucket, paths] of byBucket) {
    if (paths.length === 0) continue;
    const { error: storageRemoveError } = await client.storage
      .from(bucket)
      .remove(paths);
    if (storageRemoveError) {
      storageError = storageRemoveError.message;
      for (const object_path of paths) {
        storagePending.push({ bucket, object_path });
      }
    } else {
      for (const object_path of paths) {
        storageRemoved.push({ bucket, object_path });
      }
    }
  }

  if (mediaAssetsError && storagePending.length === 0) {
    // Assets rows may linger; keep DB paths for ops cleanup.
    for (const target of storageTargets) {
      storagePending.push(target);
    }
  }

  const { data: stillThere, error: verifyError } = await client
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .maybeSingle();

  if (verifyError) {
    throw new PermanentDeleteError({
      message: "No se pudo verificar el borrado del vehículo.",
      stage: "verify",
      vehicleId,
      supabaseCode: verifyError.code,
      cause: verifyError,
      storagePending,
    });
  }
  if (stillThere) {
    throw new PermanentDeleteError({
      message: "El vehículo sigue existiendo tras el borrado.",
      stage: "verify",
      vehicleId,
      storagePending,
    });
  }

  return {
    vehicleId: vehicle.id,
    slug: vehicle.slug,
    category: vehicle.category,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    stockCode: vehicle.stock_code,
    mediaAssetCount: mediaAssetIds.length,
    storageRemoved,
    storagePending,
    cloudinaryRemoved,
    cloudinaryPending,
    storageError,
  };
}

async function listStorageFolderObjects(
  client: InventoryDeleteClient,
  bucket: string,
  folder: string,
): Promise<string[]> {
  const { data, error } = await client.storage.from(bucket).list(folder, {
    limit: 1000,
  });
  if (error || !data) return [];
  return data
    .filter((item) => Boolean(item.name) && item.id != null)
    .map((item) => `${folder}/${item.name}`);
}

export function logPermanentDeleteFailure(error: PermanentDeleteError): void {
  console.error("[delete_vehicle_permanently]", {
    vehicleId: error.vehicleId,
    stage: error.stage,
    name: error.name,
    message: error.message,
    supabaseCode: error.supabaseCode,
    storagePending: error.storagePending,
  });
}
