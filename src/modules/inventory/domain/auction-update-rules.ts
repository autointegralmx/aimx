import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import type { VehicleWriteInput } from "@/modules/inventory/domain/vehicle-schema";
import {
  isAuctionClosed,
  isSameAuctionDeadline,
  normalizeAuctionAwardedAmount,
} from "@/modules/inventory/domain/vehicle-auction";

type AuctionRuleSource = {
  is_published: boolean;
  is_weekly_opportunity: boolean;
  opportunity_deadline: string | null;
  auction_awarded_amount?: number | string | null;
  status: VehicleStatus;
  deleted_at?: string | null;
};

/**
 * Server-side auction update authority:
 * - new/changed deadline must be future;
 * - expired deadline may be preserved to capture award;
 * - award only when closed;
 * - new future deadline clears prior award.
 */
export function applyAuctionUpdateRules(
  current: AuctionRuleSource,
  payload: Partial<VehicleWriteInput>,
  now: Date = new Date(),
): Partial<VehicleWriteInput> {
  const next: Partial<VehicleWriteInput> = { ...payload };

  const nextFlag =
    next.is_weekly_opportunity !== undefined
      ? Boolean(next.is_weekly_opportunity)
      : current.is_weekly_opportunity;

  const nextDeadline =
    next.opportunity_deadline !== undefined
      ? next.opportunity_deadline
      : current.opportunity_deadline;

  const nextStatus =
    (next.status as VehicleStatus | undefined) ?? current.status;
  const nextPublished =
    next.is_published !== undefined
      ? Boolean(next.is_published)
      : current.is_published;

  const deadlineProvided = next.opportunity_deadline !== undefined;
  const deadlineChanged =
    deadlineProvided &&
    !isSameAuctionDeadline(next.opportunity_deadline, current.opportunity_deadline);

  if (nextFlag) {
    const trimmed = nextDeadline?.trim() ?? "";
    if (!trimmed) {
      throw new Error("Define la fecha de cierre para publicarlo en subasta.");
    }
    const endMs = Date.parse(trimmed);
    if (Number.isNaN(endMs)) {
      throw new Error("Fecha de cierre de subasta inválida.");
    }

    const activating = !current.is_weekly_opportunity && nextFlag;
    if (activating || deadlineChanged) {
      if (endMs <= now.getTime()) {
        throw new Error("La fecha de cierre debe ser futura.");
      }
    }

    // Reprogramación a futuro: limpia adjudicación anterior.
    if ((activating || deadlineChanged) && endMs > now.getTime()) {
      next.auction_awarded_amount = null;
    }
  }

  if (next.auction_awarded_amount !== undefined) {
    const amount = normalizeAuctionAwardedAmount(next.auction_awarded_amount);
    if (next.auction_awarded_amount !== null && amount === null) {
      throw new Error("Monto de adjudicación inválido.");
    }
    if (amount !== null && amount <= 0) {
      throw new Error("Captura un monto mayor a 0 o deja el campo vacío.");
    }

    if (amount !== null) {
      if (!nextFlag) {
        throw new Error(
          "El monto de adjudicación solo aplica con En subasta activo.",
        );
      }
      if (!nextDeadline?.trim()) {
        throw new Error(
          "Define la fecha de cierre antes de capturar la adjudicación.",
        );
      }
      const closed = isAuctionClosed(
        {
          is_published: nextPublished,
          is_weekly_opportunity: nextFlag,
          opportunity_deadline: nextDeadline,
          status: nextStatus,
          deleted_at: current.deleted_at,
        },
        now,
      );
      if (!closed) {
        throw new Error(
          "El monto de adjudicación solo se captura cuando la subasta ya cerró.",
        );
      }
    }

    next.auction_awarded_amount = amount;
  }

  return next;
}
