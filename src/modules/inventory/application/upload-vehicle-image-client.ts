"use client";

import { registerUploadedVehicleImageAction } from "@/modules/inventory/application/vehicle-actions";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  buildVehicleStorageObjectPath,
  isAllowedVehicleImageMime,
  validateVehicleImageFile,
  VEHICLE_IMAGE_BUCKET,
} from "@/modules/inventory/domain/vehicle-media-rules";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/browser";

/**
 * Upload one image straight to Supabase Storage, then register metadata via
 * a tiny server action. Never send image bytes through Vercel (413 limit).
 */
export async function uploadVehicleImageDirect(input: {
  vehicleId: string;
  file: File;
  currentCount: number;
}): Promise<VehicleMediaItem> {
  const mimeType = input.file.type || "application/octet-stream";
  const validation = validateVehicleImageFile({
    mimeType,
    byteSize: input.file.size,
    currentCount: input.currentCount,
  });
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  if (!isAllowedVehicleImageMime(mimeType)) {
    throw new Error("Formato no permitido. Usa JPEG, PNG o WebP.");
  }

  const assetId = crypto.randomUUID();
  const objectPath = buildVehicleStorageObjectPath(
    input.vehicleId,
    assetId,
    mimeType,
  );

  const supabase = createSupabaseBrowserClient();
  const { error: uploadError } = await supabase.storage
    .from(VEHICLE_IMAGE_BUCKET)
    .upload(objectPath, input.file, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
  }

  const registered = await registerUploadedVehicleImageAction({
    vehicleId: input.vehicleId,
    assetId,
    objectPath,
    fileName: input.file.name,
    mimeType,
    byteSize: input.file.size,
  });

  if (!registered.ok) {
    await supabase.storage.from(VEHICLE_IMAGE_BUCKET).remove([objectPath]);
    throw new Error(registered.error);
  }

  return registered.uploaded;
}
