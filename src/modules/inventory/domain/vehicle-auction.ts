import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";

/** Single business timezone for auction display and “closes today” labels. */
export const BUSINESS_TIMEZONE = "America/Mexico_City";

/**
 * DB columns (compatibility — no migration):
 * - is_weekly_opportunity → isInAuction / “En subasta”
 * - opportunity_deadline → auctionEndsAt / “Cierre de subasta”
 * - is_featured → Destacar (independent; never means auction)
 *
 * Table: public.vehicles
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
  now?: Date;
};

export type AuctionPublicState = {
  /** Flag on, regardless of deadline validity */
  flagged: boolean;
  /** Meets public board + badge rules */
  active: boolean;
  ended: boolean;
  missingDeadline: boolean;
  endsAt: string | null;
  badgeLabel: string | null;
  closesLabel: string | null;
  closesLong: string | null;
  ctaLabel: string;
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
 * Canal “En subasta” público: publicado + available + flag + cierre futuro.
 * Mutuamente excluyente con inventario propio.
 */
export function isPublicAuctionVehicle(
  input: PublicAuctionInput,
  now?: Date,
): boolean {
  return isAuctionActive(input, now ?? input.now ?? new Date());
}

/**
 * Inventario propio público: publicado + available|reserved + SIN flag En subasta.
 * Mientras el flag esté activo (aunque la subasta haya vencido), NO es inventario propio.
 */
export function isPublicOwnedInventoryVehicle(
  input: PublicAuctionInput,
): boolean {
  if (input.deleted_at) return false;
  if (!input.is_published) return false;
  if (input.status !== "available" && input.status !== "reserved") {
    return false;
  }
  if (resolveIsInAuction(input)) return false;
  return true;
}

export type PublicChannel = "owned_inventory" | "auction" | null;

/**
 * Canal público exclusivo. Nunca owned_inventory y auction a la vez.
 * Subasta vencida con flag aún activo → null (admin debe desactivar En subasta).
 */
export function resolvePublicChannel(
  input: PublicAuctionInput,
  now: Date = input.now ?? new Date(),
): PublicChannel {
  if (isPublicAuctionVehicle(input, now)) return "auction";
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
  const ended = flagged && isAuctionEnded({ ...input, now });
  const missingDeadline = isAuctionMissingDeadline(input);

  return {
    flagged,
    active,
    ended,
    missingDeadline,
    endsAt,
    badgeLabel: active ? "En subasta" : null,
    closesLabel: active && endsAt ? formatAuctionClosesLabel(endsAt, now) : null,
    closesLong: active && endsAt ? formatAuctionClosesLong(endsAt) : null,
    ctaLabel: active
      ? "Solicitar información para participar"
      : "Contactar por WhatsApp",
    includeInAuctionBoard: active,
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
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
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
