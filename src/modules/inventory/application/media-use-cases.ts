import { assertStaffCanManageVehicles } from "@/modules/inventory/application/vehicle-use-cases";
import type { StaffContext } from "@/modules/inventory/application/vehicle-use-cases";
import { writeAuditEvent } from "@/modules/inventory/infrastructure/audit";
import type { VehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import { MAX_VEHICLE_IMAGES } from "@/modules/inventory/domain/vehicle-media-rules";

export type MediaStaffContext = StaffContext & {
  mediaRepo: VehicleMediaRepository;
};

export async function listVehicleMediaUseCase(
  ctx: MediaStaffContext,
  vehicleId: string,
) {
  assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.getAdminVehicleById(vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado.");
  return ctx.mediaRepo.listVehicleMedia(vehicleId);
}

export async function uploadVehicleImagesUseCase(
  ctx: MediaStaffContext,
  input: {
    vehicleId: string;
    files: Array<{
      fileName: string;
      mimeType: string;
      bytes: ArrayBuffer;
    }>;
  },
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.getAdminVehicleById(input.vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado.");

  const currentCount = await ctx.mediaRepo.countVehicleMedia(input.vehicleId);
  if (currentCount + input.files.length > MAX_VEHICLE_IMAGES) {
    throw new Error(`Máximo ${MAX_VEHICLE_IMAGES} fotografías por vehículo.`);
  }

  const uploaded = [];
  const errors: Array<{ fileName: string; error: string }> = [];

  for (const file of input.files) {
    try {
      const item = await ctx.mediaRepo.uploadVehicleImage({
        vehicleId: input.vehicleId,
        actorId: profile.id,
        fileName: file.fileName,
        mimeType: file.mimeType,
        bytes: file.bytes,
      });
      uploaded.push(item);
    } catch (error) {
      errors.push({
        fileName: file.fileName,
        error: error instanceof Error ? error.message : "Error al subir",
      });
    }
  }

  if (uploaded.length > 0) {
    await writeAuditEvent(ctx.client, {
      actorId: profile.id,
      action: "upload_vehicle_images",
      entityType: "vehicle",
      entityId: input.vehicleId,
      metadata: {
        uploaded_count: uploaded.length,
        failed_count: errors.length,
      },
    });
  }

  return { uploaded, errors };
}

export async function registerUploadedVehicleImageUseCase(
  ctx: MediaStaffContext,
  input: {
    vehicleId: string;
    assetId: string;
    objectPath: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
  },
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.getAdminVehicleById(input.vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado.");

  const item = await ctx.mediaRepo.attachUploadedVehicleImage({
    vehicleId: input.vehicleId,
    actorId: profile.id,
    assetId: input.assetId,
    objectPath: input.objectPath,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });

  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "upload_vehicle_images",
    entityType: "vehicle",
    entityId: input.vehicleId,
    metadata: {
      uploaded_count: 1,
      failed_count: 0,
      media_asset_id: input.assetId,
      via: "direct_storage",
    },
  });

  return item;
}

export async function setVehicleCoverUseCase(
  ctx: MediaStaffContext,
  input: { vehicleId: string; mediaAssetId: string },
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  await ctx.mediaRepo.setCover(input);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "set_vehicle_cover",
    entityType: "vehicle",
    entityId: input.vehicleId,
    metadata: { media_asset_id: input.mediaAssetId },
  });
}

export async function reorderVehicleImagesUseCase(
  ctx: MediaStaffContext,
  input: { vehicleId: string; orderedMediaAssetIds: string[] },
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  await ctx.mediaRepo.reorderMedia(input);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "reorder_vehicle_images",
    entityType: "vehicle",
    entityId: input.vehicleId,
    metadata: { count: input.orderedMediaAssetIds.length },
  });
}

export async function deleteVehicleImageUseCase(
  ctx: MediaStaffContext,
  input: { vehicleId: string; mediaAssetId: string },
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.getAdminVehicleById(input.vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado.");

  const result = await ctx.mediaRepo.deleteVehicleImage({
    vehicleId: input.vehicleId,
    mediaAssetId: input.mediaAssetId,
    isPublished: vehicle.is_published,
  });

  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "delete_vehicle_image",
    entityType: "vehicle",
    entityId: input.vehicleId,
    metadata: {
      media_asset_id: input.mediaAssetId,
      promoted_cover_id: result.promotedCoverId,
    },
  });

  return result;
}
