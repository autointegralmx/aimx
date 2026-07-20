import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/lib/database.types";
import { requirePublicSupabaseEnv } from "@/shared/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
