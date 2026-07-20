/**
 * Central guard for values that must never appear as public content.
 * Capture placeholders and empty inputs are treated as unknown.
 */
const UNKNOWN_TOKENS = new Set([
  "desconocido",
  "por confirmar",
  "n/a",
  "na",
  "no disponible",
  "sin dato",
  "sin datos",
  "unknown",
  "tbd",
  "-",
  "--",
]);

export function isUnknownPublicValue(
  value: string | number | null | undefined,
): boolean {
  if (value == null) return true;
  if (typeof value === "number") {
    return !Number.isFinite(value);
  }
  const trimmed = value.trim();
  if (!trimmed) return true;
  return UNKNOWN_TOKENS.has(normalizedToken(trimmed));
}

/** Mileage: null/undefined/0/invalid → unknown (never show “0 km”). */
export function isUnknownMileage(
  mileageKm: number | null | undefined,
): boolean {
  if (mileageKm == null) return true;
  if (!Number.isFinite(mileageKm)) return true;
  if (mileageKm <= 0) return true;
  return false;
}

function normalizedToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
