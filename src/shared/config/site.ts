/**
 * Site origin helper — never hardcode domain in UI logic.
 * Prefers NEXT_PUBLIC_SITE_URL; falls back to Vercel URL in deploy.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) {
    return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  }

  return "http://localhost:3000";
}
