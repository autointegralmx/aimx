import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import { isAuctionActive } from "@/modules/inventory/domain/vehicle-auction";

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
  make?: string | null;
  model?: string | null;
  year?: number | null;
  category?: string | null;
  slug?: string | null;
  has_cover_image: boolean;
  image_count: number;
}): void {
  if (!input.make?.trim()) {
    throw new Error("Publish requires make");
  }
  if (!input.model?.trim()) {
    throw new Error("Publish requires model");
  }
  if (!input.year) {
    throw new Error("Publish requires year");
  }
  if (!input.category) {
    throw new Error("Publish requires category");
  }
  if (input.status !== "available" && input.status !== "reserved") {
    throw new Error("Publish requires status available or reserved");
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
  return isAuctionActive(input, input.now);
}

/** UX labels for admin (Spanish). */
export const vehicleStatusLabel: Record<VehicleStatus, string> = {
  draft: "Borrador",
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
  archived: "Archivado",
};
