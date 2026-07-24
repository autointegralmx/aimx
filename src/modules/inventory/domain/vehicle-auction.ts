import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";

/** Single business timezone for auction display and “closes today” labels. */
export const BUSINESS_TIMEZONE = "America/Mexico_City";

/**
 * DB columns (compatibility — no rename):
 * - is_weekly_opportunity → isInAuction / “En subasta”
 * - opportunity_deadline → auctionEndsAt / “Cierre de subasta”
 * - auction_awarded_amount → monto de adjudicación (solo historial cerrado)
 * - is_featured → Destacar (independent; never means auction)
 *
 * Table: public.vehicles
 * Closed is derived: flag + valid deadline <= now (no auction_closed column).
 */

export type PublicAuctionInput = {
  is_published?: boolean | null;
  /** @deprecated domain alias — maps from is_weekly_opportunity */
  is_weekly_opportunity?: boolean | null;
  isInAuction?: boolean | null;
  status?: VehicleStatus | string | null;
  deleted_at?: string | null;
  /** @deprecated domain alias — maps from opportunity_deadline */
  opportunity_deadline?: string | null;
  auctionEndsAt?: string | null;
  auction_awarded_amount?: number | string | null;
  auctionAwardedAmount?: number | string | null;
  now?: Date;
};

export type AuctionPublicState = {
  /** Flag on, regardless of deadline validity */
  flagged: boolean;
  /** Meets public board + badge rules for live auction */
  active: boolean;
  /** Deadline passed (flag may still be on); prefer `closed` for board rules */
  ended: boolean;
  /** Published board-eligible closed auction (historial) */
  closed: boolean;
  missingDeadline: boolean;
  endsAt: string | null;
  awardedAmount: number | null;
  awardedLabel: string | null;
  badgeLabel: string | null;
  statusLabel: "En subasta" | "Subasta cerrada" | null;
  closesLabel: string | null;
  closesLong: string | null;
  closedLabel: string | null;
  closedLong: string | null;
  ctaLabel: string;
  canParticipate: boolean;
  includeInAuctionBoard: boolean;
};

export function resolveIsInAuction(input: {
  is_weekly_opportunity?: boolean | null;
  isInAuction?: boolean | null;
}): boolean {
  if (typeof input.isInAuction === "boolean") return input.isInAuction;
  return Boolean(input.is_weekly_opportunity);
}

export function resolveAuctionEndsAt(input: {
  opportunity_deadline?: string | null;
  auctionEndsAt?: string | null;
}): string | null {
  const value = input.auctionEndsAt ?? input.opportunity_deadline ?? null;
  const trimmed = value?.trim();
  return trimmed || null;
}

/** Normalize Supabase numeric (number | string) → finite number or null. */
export function normalizeAuctionAwardedAmount(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value;
  }
  return null;
}

export function resolveAuctionAwardedAmount(input: {
  auction_awarded_amount?: number | string | null;
  auctionAwardedAmount?: number | string | null;
}): number | null {
  return normalizeAuctionAwardedAmount(
    input.auctionAwardedAmount ?? input.auction_awarded_amount,
  );
}

/** “Adjudicada en $185,000 MXN” — null when missing or not > 0. */
export function formatAuctionAwardedLabel(
  amount: number | string | null | undefined,
): string | null {
  const value = normalizeAuctionAwardedAmount(amount);
  if (value === null || value <= 0) return null;
  const formatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `Adjudicada en ${formatted} MXN`;
}

/**
 * Única fuente de verdad para subasta pública activa.
 * Alias: isPublicAuctionVehicle (compat).
 */
export function isAuctionActive(
  input: PublicAuctionInput,
  now: Date = input.now ?? new Date(),
): boolean {
  if (input.deleted_at) return false;
  if (!input.is_published) return false;
  if (!resolveIsInAuction(input)) return false;
  if (input.status !== "available") return false;

  const endsAt = resolveAuctionEndsAt(input);
  if (!endsAt) return false;

  const endMs = Date.parse(endsAt);
  if (Number.isNaN(endMs)) return false;
  return endMs > now.getTime();
}

/**
 * Subasta cerrada en tablero público (historial).
 * Flag on + published + available|reserved + deadline válido vencido.
 */
export function isAuctionClosed(
  input: PublicAuctionInput,
  now: Date = input.now ?? new Date(),
): boolean {
  if (input.deleted_at) return false;
  if (!input.is_published) return false;
  if (!resolveIsInAuction(input)) return false;
  if (input.status !== "available" && input.status !== "reserved") return false;

  const endsAt = resolveAuctionEndsAt(input);
  if (!endsAt) return false;

  const endMs = Date.parse(endsAt);
  if (Number.isNaN(endMs)) return false;
  return endMs <= now.getTime();
}

/**
 * Canal “En subasta” público activo: publicado + available + flag + cierre futuro.
 * Mutuamente excluyente con inventario propio.
 */
export function isPublicAuctionVehicle(
  input: PublicAuctionInput,
  now?: Date,
): boolean {
  return isAuctionActive(input, now ?? input.now ?? new Date());
}

/**
 * Inventario propio público: publicado + available|reserved|sold + SIN flag En subasta.
 * Sold stays visible with a Vendido badge. Auction flag (even expired) excludes owned inventory.
 */
export function isPublicOwnedInventoryVehicle(
  input: PublicAuctionInput,
): boolean {
  if (input.deleted_at) return false;
  if (!input.is_published) return false;
  if (
    input.status !== "available" &&
    input.status !== "reserved" &&
    input.status !== "sold"
  ) {
    return false;
  }
  if (resolveIsInAuction(input)) return false;
  return true;
}

export type PublicChannel = "owned_inventory" | "auction" | null;

/**
 * Canal público exclusivo. Nunca owned_inventory y auction a la vez.
 * Activas y cerradas (flag aún activo) → auction; se diferencian vía AuctionPublicState.
 */
export function resolvePublicChannel(
  input: PublicAuctionInput,
  now: Date = input.now ?? new Date(),
): PublicChannel {
  if (isAuctionActive(input, now) || isAuctionClosed(input, now)) {
    return "auction";
  }
  if (isPublicOwnedInventoryVehicle(input)) return "owned_inventory";
  return null;
}

/**
 * Single DTO for admin list, cards, detail, preview, and /subastas.
 * Components must not re-implement auction rules.
 */
export function resolveAuctionPublicState(
  input: PublicAuctionInput,
  now: Date = input.now ?? new Date(),
): AuctionPublicState {
  const flagged = resolveIsInAuction(input);
  const endsAt = resolveAuctionEndsAt(input);
  const active = isAuctionActive(input, now);
  const closed = isAuctionClosed(input, now);
  const ended = flagged && isAuctionEnded({ ...input, now });
  const missingDeadline = isAuctionMissingDeadline(input);
  const awardedAmount = closed
    ? resolveAuctionAwardedAmount(input)
    : null;
  const awardedLabel = closed
    ? formatAuctionAwardedLabel(awardedAmount)
    : null;

  const statusLabel: AuctionPublicState["statusLabel"] = active
    ? "En subasta"
    : closed
      ? "Subasta cerrada"
      : null;

  return {
    flagged,
    active,
    ended,
    closed,
    missingDeadline,
    endsAt,
    awardedAmount,
    awardedLabel,
    badgeLabel: statusLabel,
    statusLabel,
    closesLabel: active && endsAt ? formatAuctionClosesLabel(endsAt, now) : null,
    closesLong: active && endsAt ? formatAuctionClosesLong(endsAt) : null,
    closedLabel: closed && endsAt ? formatAuctionClosedLabel(endsAt) : null,
    closedLong: closed && endsAt ? formatAuctionClosesLong(endsAt) : null,
    ctaLabel: active
      ? "Solicitar información para participar"
      : closed
        ? "Consultar unidades disponibles"
        : "Contactar por WhatsApp",
    canParticipate: active,
    includeInAuctionBoard: active || closed,
  };
}

/** True when flag is on but deadline is missing or invalid (admin warning). */
export function isAuctionMissingDeadline(input: {
  is_weekly_opportunity?: boolean | null;
  isInAuction?: boolean | null;
  opportunity_deadline?: string | null;
  auctionEndsAt?: string | null;
}): boolean {
  if (!resolveIsInAuction(input)) return false;
  const endsAt = resolveAuctionEndsAt(input);
  if (!endsAt) return true;
  return Number.isNaN(Date.parse(endsAt));
}

export function isAuctionEnded(input: {
  opportunity_deadline?: string | null;
  auctionEndsAt?: string | null;
  now?: Date;
}): boolean {
  const endsAt = resolveAuctionEndsAt(input);
  if (!endsAt) return false;
  const endMs = Date.parse(endsAt);
  if (Number.isNaN(endMs)) return false;
  const now = input.now ?? new Date();
  return endMs <= now.getTime();
}

/** Same UTC instant (tolerates equivalent ISO strings). */
export function isSameAuctionDeadline(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = a?.trim() || "";
  const right = b?.trim() || "";
  if (!left && !right) return true;
  if (!left || !right) return false;
  const la = Date.parse(left);
  const lb = Date.parse(right);
  if (Number.isNaN(la) || Number.isNaN(lb)) return left === right;
  return la === lb;
}

export function formatAuctionClosesAt(
  iso: string,
  now: Date = new Date(),
): string {
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return "";

  const formatted = new Intl.DateTimeFormat("es-MX", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(end);

  if (isSameMexicoCityDay(end, now)) {
    const timeOnly = new Intl.DateTimeFormat("es-MX", {
      timeZone: BUSINESS_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(end);
    return `Cierra hoy · ${timeOnly}`;
  }

  return formatted.replace(/\s+/g, " ").trim();
}

export function formatAuctionClosesLabel(iso: string, now?: Date): string {
  const body = formatAuctionClosesAt(iso, now);
  if (!body) return "";
  if (body.startsWith("Cierra")) return body;
  return `Cierra: ${body}`;
}

export function formatAuctionClosedLabel(iso: string): string {
  const body = formatAuctionClosesLong(iso);
  if (!body) return "";
  return `Cerró el ${body}`;
}

/** Long form for detail page. */
export function formatAuctionClosesLong(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert `<input type="datetime-local">` value to ISO UTC.
 * Interprets the wall clock as America/Mexico_City.
 */
export function mexicoCityDatetimeLocalToIso(
  localValue: string,
): string | null {
  const trimmed = localValue.trim();
  // Accept HH:mm and HH:mm:ss (Safari/Chrome time inputs often include seconds).
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(
      trimmed,
    );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  // Binary search UTC instant whose Mexico City parts match the wall time.
  let lo = Date.UTC(year, month - 1, day - 1, 0, 0, 0);
  let hi = Date.UTC(year, month - 1, day + 1, 23, 59, 59);
  for (let i = 0; i < 48; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    const parts = mexicoCityParts(new Date(mid));
    const cmp = compareParts(parts, { year, month, day, hour, minute });
    if (cmp === 0) return new Date(mid).toISOString();
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }

  // Fallback: assume CST (-06:00) if search fails (rare).
  const fallback = new Date(
    Date.UTC(year, month - 1, day, hour + 6, minute, 0),
  );
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
}

/** ISO → datetime-local value in America/Mexico_City. */
export function isoToMexicoCityDatetimeLocal(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = mexicoCityParts(date);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

/**
 * Sort auction board: active by nearest deadline, then closed by most recent close.
 */
export function sortAuctionBoardVehicles<
  T extends {
    opportunity_deadline?: string | null;
    auctionEndsAt?: string | null;
    is_weekly_opportunity?: boolean | null;
    isInAuction?: boolean | null;
    is_published?: boolean | null;
    status?: string | null;
    deleted_at?: string | null;
  },
>(rows: T[], now: Date): T[] {
  return [...rows].sort((a, b) => {
    const aActive = isAuctionActive(a, now);
    const bActive = isAuctionActive(b, now);
    if (aActive !== bActive) return aActive ? -1 : 1;

    const aEnd = resolveAuctionEndsAt(a);
    const bEnd = resolveAuctionEndsAt(b);
    const aMs = aEnd ? Date.parse(aEnd) : Number.POSITIVE_INFINITY;
    const bMs = bEnd ? Date.parse(bEnd) : Number.POSITIVE_INFINITY;
    const aSafe = Number.isNaN(aMs) ? Number.POSITIVE_INFINITY : aMs;
    const bSafe = Number.isNaN(bMs) ? Number.POSITIVE_INFINITY : bMs;

    if (aActive && bActive) return aSafe - bSafe;
    // Closed: newest close first
    return bSafe - aSafe;
  });
}

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function mexicoCityParts(date: Date): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const bag: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  let hour = Number(bag.hour);
  // Some engines emit 24:00 for midnight — normalize.
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
  };
}

function compareParts(a: DateParts, b: DateParts): number {
  const keys: Array<keyof DateParts> = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
  ];
  for (const key of keys) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }
  return 0;
}

function isSameMexicoCityDay(a: Date, b: Date): boolean {
  const left = mexicoCityParts(a);
  const right = mexicoCityParts(b);
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day
  );
}

/** @deprecated use isPublicAuctionVehicle */
export function isActiveOpportunity(input: PublicAuctionInput): boolean {
  return isPublicAuctionVehicle(input);
}
