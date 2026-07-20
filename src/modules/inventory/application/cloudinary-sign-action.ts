"use server";

import { z } from "zod";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { assertStaffCanManageVehicles } from "@/modules/inventory/application/vehicle-use-cases";
import {
  buildCloudinaryUploadPublicIdLeaf,
  buildCloudinaryVehicleFolder,
  buildCloudinaryVehiclePublicId,
  isUuid,
} from "@/modules/inventory/domain/cloudinary-vehicle-paths";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { signCloudinaryUploadParams } from "@/shared/lib/cloudinary/sign-upload";
import { logCloudinaryServerError } from "@/shared/lib/cloudinary/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

export type CloudinaryUploadSignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  /** Leaf public_id for the upload API (paired with folder). */
  publicId: string;
  /** Full public_id stored in DB / delivery. */
  fullPublicId: string;
  assetId: string;
  vehicleId: string;
};

/**
 * Staff-only signed upload grant.
 * Server generates folder + public_id — client cannot choose arbitrary paths.
 */
export async function createCloudinaryUploadSignatureAction(
  input: unknown,
): Promise<
  | { ok: true; data: CloudinaryUploadSignature }
  | { ok: false; error: string }
> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      assetId: z.string().uuid(),
      timestamp: z.number().int().positive().optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Datos de firma inválidos." };
  }

  const { vehicleId, assetId } = parsed.data;
  if (!isUuid(vehicleId) || !isUuid(assetId)) {
    return { ok: false, error: "vehicleId o assetId inválido." };
  }

  try {
    const profile = await requireStaffProfile();
    assertStaffCanManageVehicles({
      supabaseConfigured: true,
      hasSession: true,
      profile,
    });

    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const vehicle = await repo.getAdminVehicleById(vehicleId);
    if (!vehicle) {
      return { ok: false, error: "Vehículo no encontrado." };
    }

    const folder = buildCloudinaryVehicleFolder(vehicleId);
    const publicIdLeaf = buildCloudinaryUploadPublicIdLeaf(assetId);
    const fullPublicId = buildCloudinaryVehiclePublicId(vehicleId, assetId);
    const timestamp =
      parsed.data.timestamp ?? Math.floor(Date.now() / 1000);

    const signed = signCloudinaryUploadParams({
      timestamp,
      folder,
      public_id: publicIdLeaf,
    });

    const payload: CloudinaryUploadSignature = {
      signature: signed.signature,
      timestamp: signed.timestamp,
      cloudName: signed.cloudName,
      apiKey: signed.apiKey,
      folder,
      publicId: publicIdLeaf,
      fullPublicId,
      assetId,
      vehicleId,
    };

    // Hard guard: never leak secret field names with values.
    if (
      "apiSecret" in payload ||
      "api_secret" in (payload as Record<string, unknown>)
    ) {
      return { ok: false, error: "Error interno de firma." };
    }

    return { ok: true, data: payload };
  } catch (error) {
    logCloudinaryServerError("cloudinary.sign_upload", error, {
      vehicleIdPresent: Boolean(vehicleId),
      assetIdPresent: Boolean(assetId),
    });
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo autorizar la subida.",
    };
  }
}
