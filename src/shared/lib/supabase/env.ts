/**
 * Central public Supabase env reads. Never log secret values.
 */
export type PublicSupabaseEnv = {
  url: string | null;
  anonKey: string | null;
  configured: boolean;
};

export function readPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}

export function requirePublicSupabaseEnv(): { url: string; anonKey: string } {
  const env = readPublicSupabaseEnv();
  if (!env.url || !env.anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Define ambas en .env.local y en Vercel → Settings → Environment Variables " +
        "(Production y Preview), luego redespliega.",
    );
  }
  return { url: env.url, anonKey: env.anonKey };
}

export function logServerError(
  scope: string,
  error: unknown,
  extra: Record<string, unknown> = {},
): void {
  const env = readPublicSupabaseEnv();
  console.error(`[${scope}]`, {
    hasSupabaseUrl: Boolean(env.url),
    hasSupabaseAnonKey: Boolean(env.anonKey),
    errorName: error instanceof Error ? error.name : "unknown",
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...extra,
  });
}
