import { createHash } from "node:crypto";

/**
 * Pure Cloudinary signature helper (no env / no server-only).
 * Caller supplies apiSecret — never log it.
 */
export function createCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    toSign[key] = String(value);
  }
  const sorted = Object.keys(toSign)
    .sort()
    .map((key) => `${key}=${toSign[key]}`)
    .join("&");
  return createHash("sha1")
    .update(sorted + apiSecret)
    .digest("hex");
}
