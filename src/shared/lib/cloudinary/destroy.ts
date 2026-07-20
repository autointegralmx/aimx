import "server-only";

import {
  getCloudinary,
  logCloudinaryServerError,
} from "@/shared/lib/cloudinary/server";

export type CloudinaryDestroyResult =
  | { ok: true; result: string }
  | { ok: false; error: string };

/**
 * Destroy a Cloudinary asset by public_id. Server-only.
 * Does not log secrets.
 */
export async function destroyCloudinaryAsset(input: {
  publicId: string;
  resourceType?: string;
}): Promise<CloudinaryDestroyResult> {
  const publicId = input.publicId.trim();
  if (!publicId) {
    return { ok: false, error: "public_id vacío." };
  }

  try {
    const cloudinary = getCloudinary();
    const response = (await cloudinary.uploader.destroy(publicId, {
      resource_type: input.resourceType?.trim() || "image",
      invalidate: true,
    })) as { result?: string };

    const result = response.result ?? "unknown";
    // "ok" = deleted; "not found" is treated as success for idempotent cleanup.
    if (result === "ok" || result === "not found") {
      return { ok: true, result };
    }

    logCloudinaryServerError("cloudinary.destroy", new Error(result), {
      publicId,
      result,
    });
    return { ok: false, error: `Cloudinary destroy: ${result}` };
  } catch (error) {
    logCloudinaryServerError("cloudinary.destroy", error, { publicId });
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el recurso en Cloudinary.",
    };
  }
}
