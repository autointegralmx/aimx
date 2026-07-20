import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/lib/database.types";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Define ambas en .env.local y en Vercel → Settings → Environment Variables.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
