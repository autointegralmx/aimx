"use server";

import { z } from "zod";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  archiveVehicleUseCase,
  createVehicleDraftUseCase,
  duplicateVehicleUseCase,
  makeVehicleAvailableUseCase,
  markVehicleSoldUseCase,
  publishVehicleUseCase,
  reserveVehicleUseCase,
  unpublishVehicleUseCase,
  updateVehicleUseCase,
  type StaffContext,
} from "@/modules/inventory/application/vehicle-use-cases";
import { revalidateVehicleSurfaces } from "@/modules/inventory/application/revalidate-vehicle-paths";
import {
  vehicleDraftSchema,
  vehicleUpdateSchema,
} from "@/modules/inventory/domain/vehicle-schema";
import {
  deleteVehicleImageUseCase,
  reorderVehicleImagesUseCase,
  setVehicleCoverUseCase,
  uploadVehicleImagesUseCase,
} from "@/modules/inventory/application/media-use-cases";

export type VehicleActionResult =
  | {
      ok: true;
      message: string;
      vehicleId?: string;
      slug?: string;
    }
  | { ok: false; error: string };

const idSchema = z.object({
  vehicleId: z.string().uuid(),
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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

export type UploadImagesResult =
  | {
      ok: true;
      message: string;
      uploadedCount: number;
      uploaded: Awaited<
        ReturnType<typeof uploadVehicleImagesUseCase>
      >["uploaded"];
      errors: Array<{ fileName: string; error: string }>;
    }
  | { ok: false; error: string };

export async function uploadVehicleImagesAction(
  formData: FormData,
): Promise<UploadImagesResult> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const idParsed = z.string().uuid().safeParse(vehicleId);
  if (!idParsed.success) return { ok: false, error: "Identificador inválido." };

  const files = formData.getAll("files").filter((item): item is File => {
    return typeof File !== "undefined" && item instanceof File && item.size > 0;
  });

  if (files.length === 0) {
    return { ok: false, error: "Selecciona al menos una imagen." };
  }

  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    const mediaRepo = createVehicleMediaRepository(client);
    const prepared = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes: await file.arrayBuffer(),
      })),
    );

    const result = await uploadVehicleImagesUseCase(
      { profile, client, repo, mediaRepo },
      { vehicleId: idParsed.data, files: prepared },
    );

    const vehicle = await repo.getAdminVehicleById(idParsed.data);
    revalidateVehicleSurfaces({
      slug: vehicle?.slug,
      vehicleId: idParsed.data,
    });

    if (result.uploaded.length === 0) {
      return {
        ok: false,
        error:
          result.errors[0]?.error ??
          "No se pudo subir ninguna imagen.",
      };
    }

    return {
      ok: true,
      message:
        result.errors.length > 0
          ? `Se subieron ${result.uploaded.length} imagen(es). Algunas fallaron.`
          : `Se subieron ${result.uploaded.length} imagen(es).`,
      uploadedCount: result.uploaded.length,
      uploaded: result.uploaded,
      errors: result.errors,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudieron subir imágenes.",
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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

  const parsed = vehicleUpdateSchema.safeParse(body);
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
    revalidateVehicleSurfaces({ slug: vehicle.slug });
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
