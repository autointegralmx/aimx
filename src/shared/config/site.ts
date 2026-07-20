const PRODUCTION_ORIGIN = "https://autointegral.mx";

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

function withHttps(hostOrUrl: string): string {
  if (hostOrUrl.startsWith("http://") || hostOrUrl.startsWith("https://")) {
    return normalizeOrigin(hostOrUrl);
  }
  return `https://${normalizeOrigin(hostOrUrl)}`;
}

function isLocalOrigin(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

/**
 * Canonical public origin for metadata, sitemap, WhatsApp OG, and share URLs.
 *
 * Never use ephemeral Vercel deployment URLs (*.vercel.app with SSO) for
 * production Open Graph — WhatsApp cannot fetch those images.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv && !isLocalOrigin(fromEnv)) {
    return withHttps(fromEnv);
  }

  if (process.env.VERCEL_ENV === "production") {
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (productionHost && !isLocalOrigin(productionHost)) {
      return withHttps(productionHost);
    }
    return PRODUCTION_ORIGIN;
  }

  // Preview / local: deployment URL or localhost is fine for non-share use.
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return withHttps(vercel);
  }

  if (fromEnv) {
    return withHttps(fromEnv);
  }

  return "http://localhost:3000";
}

/** Absolute URL for Open Graph / Twitter share images (must be publicly crawlable). */
export function getShareImageUrl(path = "/og-share.png"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}
