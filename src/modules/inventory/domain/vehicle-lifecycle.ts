import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import {
  assertVehicleStatusTransition,
  normalizeVehiclePublicationFlags,
} from "@/modules/inventory/domain/vehicle-status";

export type VehicleLifecyclePatch = {
  status: VehicleStatus;
  is_published: boolean;
  is_featured: boolean;
  is_weekly_opportunity: boolean;
  published_at?: string | null;
  opportunity_deadline?: string | null;
  featured_order?: number | null;
};

type FlagSource = {
  status: VehicleStatus;
  is_published: boolean;
  is_featured: boolean;
  is_weekly_opportunity: boolean;
  published_at?: string | null;
  opportunity_deadline?: string | null;
  featured_order?: number | null;
};

function applyNormalized(
  current: FlagSource,
  next: Partial<FlagSource>,
): VehicleLifecyclePatch {
  const merged: FlagSource = {
    status: next.status ?? current.status,
    is_published: next.is_published ?? current.is_published,
    is_featured: next.is_featured ?? current.is_featured,
    is_weekly_opportunity:
      next.is_weekly_opportunity ?? current.is_weekly_opportunity,
    published_at:
      next.published_at !== undefined
        ? next.published_at
        : current.published_at,
    opportunity_deadline:
      next.opportunity_deadline !== undefined
        ? next.opportunity_deadline
        : current.opportunity_deadline,
    featured_order:
      next.featured_order !== undefined
        ? next.featured_order
        : current.featured_order,
  };

  if (next.status && next.status !== current.status) {
    assertVehicleStatusTransition(current.status, next.status);
  }

  const normalized = normalizeVehiclePublicationFlags({
    status: merged.status,
    is_published: merged.is_published,
    is_featured: merged.is_featured,
    is_weekly_opportunity: merged.is_weekly_opportunity,
  });

  const patch: VehicleLifecyclePatch = {
    status: normalized.status,
    is_published: normalized.is_published,
    is_featured: normalized.is_featured,
    is_weekly_opportunity: normalized.is_weekly_opportunity,
  };

  if (!normalized.is_published) {
    // Keep published_at history when unpublishing; clear only on sold/archived drafts handled below.
    if (
      normalized.status === "sold" ||
      normalized.status === "archived" ||
      normalized.status === "draft"
    ) {
      patch.published_at = null;
    }
  }

  if (!normalized.is_weekly_opportunity) {
    if (
      normalized.status === "sold" ||
      normalized.status === "archived" ||
      !normalized.is_published
    ) {
      patch.opportunity_deadline = null;
    }
  }

  if (!normalized.is_featured) {
    if (normalized.status === "archived" || normalized.status === "sold") {
      patch.featured_order = null;
    }
  }

  return patch;
}

export function buildReservePatch(current: FlagSource): VehicleLifecyclePatch {
  return applyNormalized(current, { status: "reserved" });
}

export function buildMakeAvailablePatch(
  current: FlagSource,
): VehicleLifecyclePatch {
  return applyNormalized(current, { status: "available" });
}

export function buildMarkSoldPatch(current: FlagSource): VehicleLifecyclePatch {
  return applyNormalized(current, {
    status: "sold",
    is_published: false,
    is_featured: false,
    is_weekly_opportunity: false,
  });
}

export function buildArchivePatch(current: FlagSource): VehicleLifecyclePatch {
  return applyNormalized(current, {
    status: "archived",
    is_published: false,
    is_featured: false,
    is_weekly_opportunity: false,
  });
}

export function buildUnpublishPatch(
  current: FlagSource,
): VehicleLifecyclePatch {
  // Keep is_featured for editorial reuse; clear opportunity (requires published).
  return applyNormalized(current, {
    is_published: false,
    is_weekly_opportunity: false,
  });
}

export function buildPublishPatch(
  current: FlagSource,
  nowIso: string,
): VehicleLifecyclePatch {
  const patch = applyNormalized(current, {
    is_published: true,
  });
  if (patch.is_published && !current.published_at) {
    patch.published_at = nowIso;
  }
  return patch;
}
