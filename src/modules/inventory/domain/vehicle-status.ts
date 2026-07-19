import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";

const transitions: Record<VehicleStatus, readonly VehicleStatus[]> = {
  draft: ["available", "archived"],
  available: ["reserved", "sold", "archived", "draft"],
  reserved: ["available", "sold", "archived"],
  sold: ["archived"],
  archived: ["draft"],
};

export function canTransitionVehicleStatus(
  from: VehicleStatus,
  to: VehicleStatus,
): boolean {
  if (from === to) return true;
  return transitions[from].includes(to);
}

export function assertVehicleStatusTransition(
  from: VehicleStatus,
  to: VehicleStatus,
): void {
  if (!canTransitionVehicleStatus(from, to)) {
    throw new Error(`Invalid vehicle status transition: ${from} → ${to}`);
  }
}

export type VehiclePublicationFlags = {
  status: VehicleStatus;
  is_published: boolean;
  is_featured: boolean;
  is_weekly_opportunity: boolean;
  deleted_at?: string | null;
};

/**
 * Central publication rules (A1).
 * Also enforced in SQL constraints + trigger.
 */
export function normalizeVehiclePublicationFlags(
  input: VehiclePublicationFlags,
): VehiclePublicationFlags {
  const next = { ...input };

  if (next.deleted_at) {
    next.is_published = false;
    next.is_weekly_opportunity = false;
    next.is_featured = false;
    return next;
  }

  if (next.status === "draft") {
    next.is_published = false;
    next.is_weekly_opportunity = false;
  }

  if (next.status === "sold") {
    next.is_published = false;
    next.is_weekly_opportunity = false;
  }

  if (next.status === "archived") {
    next.is_published = false;
    next.is_weekly_opportunity = false;
    next.is_featured = false;
  }

  if (next.is_published) {
    if (next.status !== "available" && next.status !== "reserved") {
      next.is_published = false;
    }
  }

  if (next.is_weekly_opportunity) {
    if (
      !next.is_published ||
      (next.status !== "available" && next.status !== "reserved")
    ) {
      next.is_weekly_opportunity = false;
    }
  }

  return next;
}

export function assertCanPublish(input: {
  status: VehicleStatus;
  public_title?: string | null;
  short_description?: string | null;
  slug?: string | null;
  has_cover_image: boolean;
  image_count: number;
}): void {
  if (input.status !== "available" && input.status !== "reserved") {
    throw new Error("Publish requires status available or reserved");
  }
  if (!input.public_title?.trim()) {
    throw new Error("Publish requires public_title");
  }
  if (!input.short_description?.trim()) {
    throw new Error("Publish requires short_description");
  }
  if (!input.slug?.trim()) {
    throw new Error("Publish requires slug");
  }
  if (input.image_count < 1) {
    throw new Error("Publish requires at least one image");
  }
  if (!input.has_cover_image) {
    throw new Error("Publish requires a cover image");
  }
}

export function isActiveOpportunity(input: {
  is_published: boolean;
  is_weekly_opportunity: boolean;
  status: VehicleStatus;
  deleted_at?: string | null;
  opportunity_deadline?: string | null;
  now?: Date;
}): boolean {
  if (input.deleted_at) return false;
  if (!input.is_published || !input.is_weekly_opportunity) return false;
  if (input.status !== "available" && input.status !== "reserved") return false;
  if (input.opportunity_deadline) {
    const now = input.now ?? new Date();
    if (new Date(input.opportunity_deadline).getTime() <= now.getTime()) {
      return false;
    }
  }
  return true;
}

/** UX labels for admin (Spanish). */
export const vehicleStatusLabel: Record<VehicleStatus, string> = {
  draft: "Borrador",
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
  archived: "Archivado",
};
