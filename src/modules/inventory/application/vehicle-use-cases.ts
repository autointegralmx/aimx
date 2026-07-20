import type { AdminProfileAccess } from "@/modules/admin/domain/admin-access";
import { evaluateAdminAccess } from "@/modules/admin/domain/admin-access";
import {
  getValidAdminVehicleActions,
  type AdminVehicleAction,
} from "@/modules/inventory/domain/admin-vehicle-actions";
import type { AdminVehicleListFilters } from "@/modules/inventory/domain/admin-list-filters";
import type {
  VehicleDraftInput,
  VehicleWriteInput,
} from "@/modules/inventory/domain/vehicle-schema";
import {
  buildArchivePatch,
  buildMakeAvailablePatch,
  buildMarkSoldPatch,
  buildPublishPatch,
  buildReservePatch,
  buildUnpublishPatch,
} from "@/modules/inventory/domain/vehicle-lifecycle";
import { resolvePublicCopyFields } from "@/modules/inventory/domain/vehicle-auto-copy";
import { assertCanPublish } from "@/modules/inventory/domain/vehicle-status";
import { writeAuditEvent } from "@/modules/inventory/infrastructure/audit";
import type {
  InventorySupabase,
  VehicleRepository,
} from "@/modules/inventory/infrastructure/vehicle-repository";
import {
  deleteVehiclePermanently,
  type PermanentVehicleDeleteResult,
} from "@/modules/inventory/infrastructure/permanent-vehicle-delete";

export type StaffContext = {
  profile: AdminProfileAccess;
  client: InventorySupabase;
  repo: VehicleRepository;
};

export function assertStaffCanManageVehicles(input: {
  supabaseConfigured: boolean;
  hasSession: boolean;
  profile: AdminProfileAccess | null;
}): AdminProfileAccess {
  const gate = evaluateAdminAccess(input);
  if (!gate.ok) {
    switch (gate.reason) {
      case "missing_config":
        throw new Error("Supabase no está configurado.");
      case "no_session":
        throw new Error("Debes iniciar sesión.");
      case "no_profile":
        throw new Error("Tu cuenta no tiene perfil de administrador.");
      case "inactive":
        throw new Error("Tu acceso administrativo está inactivo.");
      case "forbidden_role":
        throw new Error(
          "Tu rol no tiene permiso para administrar vehículos.",
        );
    }
  }
  return gate.profile;
}

async function loadForAction(
  ctx: StaffContext,
  id: string,
  action: AdminVehicleAction,
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.getAdminVehicleById(id);
  if (!vehicle) {
    throw new Error("Vehículo no encontrado.");
  }
  const allowed = getValidAdminVehicleActions(vehicle);
  if (!allowed.includes(action)) {
    throw new Error("Esta acción no está disponible para el estado actual.");
  }
  return { profile, vehicle };
}

export async function listAdminVehiclesUseCase(
  ctx: StaffContext,
  filters: AdminVehicleListFilters,
) {
  assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  return ctx.repo.listAdminVehicles(filters);
}

export async function getAdminVehicleByIdUseCase(
  ctx: StaffContext,
  id: string,
) {
  assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  return ctx.repo.getAdminVehicleById(id);
}

export async function createVehicleDraftUseCase(
  ctx: StaffContext,
  input: VehicleDraftInput,
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.createVehicleDraft(input, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "create_vehicle_draft",
    entityType: "vehicle",
    entityId: vehicle.id,
    metadata: {
      slug: vehicle.slug,
      category: vehicle.category,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    },
  });
  return vehicle;
}

export async function updateVehicleUseCase(
  ctx: StaffContext,
  id: string,
  input: Partial<VehicleWriteInput>,
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const current = await ctx.repo.getAdminVehicleById(id);
  if (!current) throw new Error("Vehículo no encontrado.");

  const payload = { ...input };
  if (current.is_published && payload.slug && payload.slug !== current.slug) {
    throw new Error(
      "El slug no se puede cambiar después de publicar el vehículo.",
    );
  }

  // Inventory form: structured fields only. Never keep manual marketing copy.
  payload.use_manual_public_copy = false;
  payload.public_tags = [];
  payload.full_description = null;
  payload.public_description = null;
  if (payload.condition_notes !== undefined) {
    const note = payload.condition_notes?.trim() ?? "";
    payload.condition_notes = note || null;
    payload.publish_observations = Boolean(note);
  }

  const copy = resolvePublicCopyFields(current, payload);
  payload.public_title = copy.public_title;
  payload.short_description = copy.short_description;
  payload.damage_summary = copy.damage_summary;
  payload.seo_title = copy.seo_title;
  payload.seo_description = copy.seo_description;
  payload.price_label = copy.price_label;

  // Opportunity/featured intent may be stored on drafts; public queries
  // only surface them when is_published (and not expired) is true.

  const vehicle = await ctx.repo.updateVehicle(id, payload, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "update_vehicle",
    entityType: "vehicle",
    entityId: vehicle.id,
    metadata: {
      slug: vehicle.slug,
      status: vehicle.status,
      is_published: vehicle.is_published,
    },
  });
  return vehicle;
}

export async function publishVehicleUseCase(
  ctx: StaffContext,
  id: string,
  media?: { imageCount: number; hasCover: boolean },
) {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });
  const vehicle = await ctx.repo.getAdminVehicleById(id);
  if (!vehicle) throw new Error("Vehículo no encontrado.");

  const imageCount = media?.imageCount ?? (vehicle.cover_url ? 1 : 0);
  const hasCover = media?.hasCover ?? Boolean(vehicle.cover_url);

  assertCanPublish({
    status: vehicle.status,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    category: vehicle.category,
    slug: vehicle.slug,
    has_cover_image: hasCover,
    image_count: imageCount,
  });

  const copy = resolvePublicCopyFields(vehicle, {});
  await ctx.repo.updateVehicle(
    id,
    {
      use_manual_public_copy: false,
      public_tags: [],
      full_description: null,
      public_description: null,
      public_title: copy.public_title,
      short_description: copy.short_description,
      damage_summary: copy.damage_summary,
      seo_title: copy.seo_title,
      seo_description: copy.seo_description,
      price_label: copy.price_label,
    },
    profile.id,
  );

  const patch = buildPublishPatch(vehicle, new Date().toISOString());
  const updated = await ctx.repo.applyLifecyclePatch(id, patch, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "publish_vehicle",
    entityType: "vehicle",
    entityId: updated.id,
    metadata: { slug: updated.slug, status: updated.status },
  });
  return updated;
}

export async function unpublishVehicleUseCase(ctx: StaffContext, id: string) {
  const { profile, vehicle } = await loadForAction(ctx, id, "unpublish");
  const patch = buildUnpublishPatch(vehicle);
  const updated = await ctx.repo.applyLifecyclePatch(id, patch, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "unpublish_vehicle",
    entityType: "vehicle",
    entityId: updated.id,
    metadata: {
      slug: updated.slug,
      status: updated.status,
      is_featured: updated.is_featured,
    },
  });
  return updated;
}

export async function reserveVehicleUseCase(ctx: StaffContext, id: string) {
  const { profile, vehicle } = await loadForAction(ctx, id, "reserve");
  const patch = buildReservePatch(vehicle);
  const updated = await ctx.repo.applyLifecyclePatch(id, patch, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "reserve_vehicle",
    entityType: "vehicle",
    entityId: updated.id,
    metadata: {
      from_status: vehicle.status,
      to_status: updated.status,
      is_published: updated.is_published,
      is_weekly_opportunity: updated.is_weekly_opportunity,
    },
  });
  return updated;
}

export async function makeVehicleAvailableUseCase(
  ctx: StaffContext,
  id: string,
) {
  const { profile, vehicle } = await loadForAction(ctx, id, "make_available");
  const patch = buildMakeAvailablePatch(vehicle);
  const updated = await ctx.repo.applyLifecyclePatch(id, patch, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "update_vehicle",
    entityType: "vehicle",
    entityId: updated.id,
    metadata: {
      operation: "make_available",
      from_status: vehicle.status,
      to_status: updated.status,
      is_published: updated.is_published,
    },
  });
  return updated;
}

export async function markVehicleSoldUseCase(ctx: StaffContext, id: string) {
  const { profile, vehicle } = await loadForAction(ctx, id, "mark_sold");
  const patch = buildMarkSoldPatch(vehicle);
  const updated = await ctx.repo.applyLifecyclePatch(id, patch, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "mark_vehicle_sold",
    entityType: "vehicle",
    entityId: updated.id,
    metadata: {
      from_status: vehicle.status,
      to_status: updated.status,
    },
  });
  return updated;
}

export async function archiveVehicleUseCase(ctx: StaffContext, id: string) {
  const { profile, vehicle } = await loadForAction(ctx, id, "archive");
  const patch = buildArchivePatch(vehicle);
  const updated = await ctx.repo.applyLifecyclePatch(id, patch, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "archive_vehicle",
    entityType: "vehicle",
    entityId: updated.id,
    metadata: {
      from_status: vehicle.status,
      to_status: updated.status,
    },
  });
  return updated;
}

export async function duplicateVehicleUseCase(ctx: StaffContext, id: string) {
  const { profile, vehicle } = await loadForAction(ctx, id, "duplicate");
  const copy = await ctx.repo.duplicateVehicle(vehicle.id, profile.id);
  await writeAuditEvent(ctx.client, {
    actorId: profile.id,
    action: "duplicate_vehicle",
    entityType: "vehicle",
    entityId: copy.id,
    metadata: {
      source_id: vehicle.id,
      source_slug: vehicle.slug,
      new_slug: copy.slug,
    },
  });
  return copy;
}

export async function deleteVehiclePermanentlyUseCase(
  ctx: StaffContext,
  id: string,
): Promise<PermanentVehicleDeleteResult> {
  const profile = assertStaffCanManageVehicles({
    supabaseConfigured: true,
    hasSession: true,
    profile: ctx.profile,
  });

  return deleteVehiclePermanently(ctx.client, {
    vehicleId: id,
    actorId: profile.id,
  });
}
