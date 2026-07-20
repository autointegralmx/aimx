"use server";

import { z } from "zod";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  archiveVehicleUseCase,
  createVehicleDraftUseCase,
  deleteVehiclePermanentlyUseCase,
  duplicateVehicleUseCase,
  makeVehicleAvailableUseCase,
  markVehicleSoldUseCase,
  moveVehicleCatalogOrderUseCase,
  publishVehicleUseCase,
  reserveVehicleUseCase,
  unpublishVehicleUseCase,
  updateVehicleUseCase,
  type StaffContext,
} from "@/modules/inventory/application/vehicle-use-cases";
import { revalidateVehicleSurfaces } from "@/modules/inventory/application/revalidate-vehicle-paths";
import {
  vehicleDraftSchema,
  parseVehicleUpdateInput,
} from "@/modules/inventory/domain/vehicle-schema";
import {
  deleteVehicleImageUseCase,
  registerCloudinaryVehicleImageUseCase,
  registerUploadedVehicleImageUseCase,
  reorderVehicleImagesUseCase,
  setVehicleCoverUseCase,
} from "@/modules/inventory/application/media-use-cases";
import {
  PermanentDeleteError,
  logPermanentDeleteFailure,
} from "@/modules/inventory/infrastructure/permanent-vehicle-delete";
import { DELETE_CONFIRM_PHRASE } from "@/modules/inventory/domain/menu-position";

export type VehicleActionResult =
  | {
      ok: true;
      message: string;
      vehicleId?: string;
      slug?: string;
      partialStorage?: boolean;
    }
  | { ok: false; error: string };

const idSchema = z.object({
  vehicleId: z.string().uuid(),
});

const permanentDeleteSchema = z.object({
  vehicleId: z.string().uuid(),
  confirmation: z.literal(DELETE_CONFIRM_PHRASE),
});

async function buildStaffContext(): Promise<StaffContext> {
  const profile = await requireStaffProfile();
  const client = await createSupabaseServerClient();
  const repo = createVehicleRepository(client);
  return { profile, client, repo };
}

function fail(error: unknown): VehicleActionResult {
  const message =
    error instanceof Error ? error.message : "No se pudo completar la acción.";
  return { ok: false, error: message };
}

export async function createVehicleDraftAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = vehicleDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisa los datos del borrador." };
  }
  try {
    const ctx = await buildStaffContext();
    const vehicle = await createVehicleDraftUseCase(ctx, parsed.data);
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Borrador creado.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function moveVehicleCatalogOrderAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      direction: z.enum(["up", "down"]),
      mode: z.enum(["catalog", "featured"]).optional().default("catalog"),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Movimiento inválido." };
  }
  try {
    const ctx = await buildStaffContext();
    await moveVehicleCatalogOrderUseCase(ctx, parsed.data);
    const vehicle = await ctx.repo.getAdminVehicleById(parsed.data.vehicleId);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: parsed.data.vehicleId,
      category: vehicle?.category,
    });
    return {
      ok: true,
      message:
        parsed.data.mode === "featured"
          ? "Orden de destacados actualizado."
          : "Orden actualizado.",
      vehicleId: parsed.data.vehicleId,
    };
  } catch (error) {
    return fail(error);
  }
}

export type UploadImagesResult =
  | {
      ok: true;
      message: string;
      uploadedCount: number;
      uploaded: Array<{ media_asset_id: string }>;
      errors: Array<{ fileName: string; error: string }>;
    }
  | { ok: false; error: string };

export async function uploadVehicleImagesAction(
  formData: FormData,
): Promise<UploadImagesResult> {
  return {
    ok: false,
    error:
      "La subida por este canal está deshabilitada. Recarga la página e intenta de nuevo.",
  };
}

export async function registerUploadedVehicleImageAction(
  input: unknown,
): Promise<
  | { ok: true; message: string; uploaded: Awaited<ReturnType<typeof registerUploadedVehicleImageUseCase>> }
  | { ok: false; error: string }
> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      assetId: z.string().uuid(),
      objectPath: z.string().min(8).max(400),
      fileName: z.string().min(1).max(240),
      mimeType: z.string().min(3).max(80),
      byteSize: z.number().int().positive().max(10 * 1024 * 1024),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de imagen inválidos." };

  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const mediaRepo = createVehicleMediaRepository(client);
    const uploaded = await registerUploadedVehicleImageUseCase(
      { profile, client, repo, mediaRepo },
      parsed.data,
    );
    const vehicle = await repo.getAdminVehicleById(parsed.data.vehicleId);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: parsed.data.vehicleId,
      category: vehicle?.category,
    });
    return {
      ok: true,
      message: "Imagen subida.",
      uploaded,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo registrar la imagen.",
    };
  }
}

export async function registerCloudinaryVehicleImageAction(
  input: unknown,
): Promise<
  | {
      ok: true;
      message: string;
      uploaded: Awaited<
        ReturnType<typeof registerCloudinaryVehicleImageUseCase>
      >;
    }
  | { ok: false; error: string }
> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      assetId: z.string().uuid(),
      publicId: z.string().min(8).max(500),
      secureUrl: z.string().url().nullable().optional(),
      resourceType: z.string().min(3).max(40),
      version: z.number().int().positive().nullable().optional(),
      format: z.string().min(1).max(20).nullable().optional(),
      width: z.number().int().positive().max(12000).nullable().optional(),
      height: z.number().int().positive().max(12000).nullable().optional(),
      byteSize: z.number().int().positive().max(10 * 1024 * 1024),
      fileName: z.string().min(1).max(240),
      mimeType: z.string().min(3).max(80),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos de imagen Cloudinary inválidos." };
  }

  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const mediaRepo = createVehicleMediaRepository(client);
    const uploaded = await registerCloudinaryVehicleImageUseCase(
      { profile, client, repo, mediaRepo },
      {
        vehicleId: parsed.data.vehicleId,
        assetId: parsed.data.assetId,
        publicId: parsed.data.publicId,
        secureUrl: parsed.data.secureUrl ?? null,
        resourceType: parsed.data.resourceType,
        version: parsed.data.version ?? null,
        format: parsed.data.format ?? null,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        byteSize: parsed.data.byteSize,
        fileName: parsed.data.fileName,
        mimeType: parsed.data.mimeType,
      },
    );
    const vehicle = await repo.getAdminVehicleById(parsed.data.vehicleId);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: parsed.data.vehicleId,
      category: vehicle?.category,
    });
    return { ok: true, message: "Imagen subida.", uploaded };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo registrar la imagen Cloudinary.",
    };
  }
}

export async function setVehicleCoverAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      mediaAssetId: z.string().uuid(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const mediaRepo = createVehicleMediaRepository(client);
    await setVehicleCoverUseCase(
      { profile, client, repo, mediaRepo },
      parsed.data,
    );
    const vehicle = await repo.getAdminVehicleById(parsed.data.vehicleId);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: parsed.data.vehicleId,
      category: vehicle?.category,
    });
    return { ok: true, message: "Portada actualizada.", vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return fail(error);
  }
}

export async function reorderVehicleImagesAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      orderedMediaAssetIds: z.array(z.string().uuid()).min(1),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Orden inválido." };
  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const mediaRepo = createVehicleMediaRepository(client);
    await reorderVehicleImagesUseCase(
      { profile, client, repo, mediaRepo },
      parsed.data,
    );
    const vehicle = await repo.getAdminVehicleById(parsed.data.vehicleId);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: parsed.data.vehicleId,
      category: vehicle?.category,
    });
    return { ok: true, message: "Orden guardado.", vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteVehicleImageAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = z
    .object({
      vehicleId: z.string().uuid(),
      mediaAssetId: z.string().uuid(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const mediaRepo = createVehicleMediaRepository(client);
    await deleteVehicleImageUseCase(
      { profile, client, repo, mediaRepo },
      parsed.data,
    );
    const vehicle = await repo.getAdminVehicleById(parsed.data.vehicleId);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: parsed.data.vehicleId,
      category: vehicle?.category,
    });
    return { ok: true, message: "Imagen eliminada.", vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return fail(error);
  }
}

export async function reserveVehicleAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const vehicle = await reserveVehicleUseCase(ctx, parsed.data.vehicleId);
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Vehículo marcado como reservado.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function makeVehicleAvailableAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const vehicle = await makeVehicleAvailableUseCase(
      ctx,
      parsed.data.vehicleId,
    );
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Vehículo marcado como disponible.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function markVehicleSoldAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const vehicle = await markVehicleSoldUseCase(ctx, parsed.data.vehicleId);
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Vehículo marcado como vendido.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveVehicleAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const vehicle = await archiveVehicleUseCase(ctx, parsed.data.vehicleId);
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Vehículo archivado.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function unpublishVehicleAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const vehicle = await unpublishVehicleUseCase(ctx, parsed.data.vehicleId);
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Vehículo despublicado.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function duplicateVehicleAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const vehicle = await duplicateVehicleUseCase(ctx, parsed.data.vehicleId);
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message:
        "Vehículo duplicado como borrador. Las fotografías no fueron copiadas.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteVehiclePermanentlyAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = permanentDeleteSchema.safeParse(input);
  if (!parsed.success) {
    if (
      typeof input === "object" &&
      input !== null &&
      "vehicleId" in input &&
      typeof (input as { vehicleId: unknown }).vehicleId === "string" &&
      !z.string().uuid().safeParse((input as { vehicleId: string }).vehicleId)
        .success
    ) {
      return { ok: false, error: "Identificador inválido." };
    }
    return {
      ok: false,
      error: "Debes escribir ELIMINAR para confirmar el borrado.",
    };
  }

  try {
    const ctx = await buildStaffContext();
    const result = await deleteVehiclePermanentlyUseCase(
      ctx,
      parsed.data.vehicleId,
    );

    revalidateVehicleSurfaces({
      slug: result.slug,
      vehicleId: result.vehicleId,
      category: result.category,
    });

    if (
      result.storageError ||
      result.storagePending.length > 0 ||
      result.cloudinaryPending.length > 0
    ) {
      console.error("[delete_vehicle_permanently] media_cleanup_partial", {
        vehicleId: result.vehicleId,
        stage: "delete_storage",
        message: result.storageError,
        storagePending: result.storagePending,
        cloudinaryPending: result.cloudinaryPending.map((item) => item.public_id),
      });
      return {
        ok: true,
        message:
          "Vehículo eliminado de la base de datos, pero algunas fotografías no se pudieron borrar del almacenamiento. Requiere limpieza pendiente.",
        vehicleId: result.vehicleId,
        slug: result.slug,
        partialStorage: true,
      };
    }

    return {
      ok: true,
      message: "Vehículo eliminado definitivamente.",
      vehicleId: result.vehicleId,
      slug: result.slug,
    };
  } catch (error) {
    if (error instanceof PermanentDeleteError) {
      logPermanentDeleteFailure(error);
      if (error.stage === "load_vehicle" && error.message.includes("no existe")) {
        return { ok: false, error: "El vehículo no existe." };
      }
      if (error.stage === "delete_vehicle") {
        return {
          ok: false,
          error:
            "No se pudo eliminar el vehículo en la base de datos. Verifica que la política de borrado esté aplicada e intenta nuevamente.",
        };
      }
      if (error.stage === "audit") {
        return {
          ok: false,
          error: "No se pudo registrar la auditoría previa al borrado.",
        };
      }
      return {
        ok: false,
        error: "No se pudo eliminar el vehículo. Intenta nuevamente.",
      };
    }
    return fail(error);
  }
}

export async function publishVehicleAction(
  input: unknown,
): Promise<VehicleActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identificador inválido." };
  try {
    const ctx = await buildStaffContext();
    const mediaRepo = createVehicleMediaRepository(ctx.client);
    const media = await mediaRepo.listVehicleMedia(parsed.data.vehicleId);
    const vehicle = await publishVehicleUseCase(ctx, parsed.data.vehicleId, {
      imageCount: media.length,
      hasCover: media.some((item) => item.is_cover),
    });
    revalidateVehicleSurfaces({ slug: vehicle.slug, category: vehicle.category });
    return {
      ok: true,
      message: "Vehículo publicado.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function updateVehicleAction(
  input: unknown,
): Promise<VehicleActionResult & { fieldErrors?: Record<string, string> }> {
  const idParsed = z
    .object({ vehicleId: z.string().uuid() })
    .safeParse(
      typeof input === "object" && input !== null
        ? { vehicleId: (input as { vehicleId?: unknown }).vehicleId }
        : {},
    );
  if (!idParsed.success) {
    return { ok: false, error: "Identificador inválido." };
  }

  const body =
    typeof input === "object" && input !== null
      ? { ...(input as Record<string, unknown>) }
      : {};
  delete body.vehicleId;

  const parsed = parseVehicleUpdateInput(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: "Revisa los campos del formulario.",
      fieldErrors,
    };
  }

  try {
    const ctx = await buildStaffContext();
    const vehicle = await updateVehicleUseCase(
      ctx,
      idParsed.data.vehicleId,
      parsed.data,
    );
    revalidateVehicleSurfaces({
      slug: vehicle.slug,
      vehicleId: vehicle.id,
      category: vehicle.category,
    });
    return {
      ok: true,
      message: "Cambios guardados.",
      vehicleId: vehicle.id,
      slug: vehicle.slug,
    };
  } catch (error) {
    return fail(error);
  }
}
