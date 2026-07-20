import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { readPublicSupabaseEnv } from "@/shared/lib/supabase/env";
import {
  adminGateMessage,
  evaluateAdminAccess,
  type AdminGateResult,
  type AdminProfileAccess,
} from "@/modules/admin/domain/admin-access";

export function isSupabaseConfigured(): boolean {
  return readPublicSupabaseEnv().configured;
}

export async function resolveAdminGate(): Promise<AdminGateResult> {
  if (!isSupabaseConfigured()) {
    return evaluateAdminAccess({
      supabaseConfigured: false,
      hasSession: false,
      profile: null,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return evaluateAdminAccess({
      supabaseConfigured: true,
      hasSession: false,
      profile: null,
    });
  }

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return evaluateAdminAccess({
      supabaseConfigured: true,
      hasSession: true,
      profile: null,
    });
  }

  return evaluateAdminAccess({
    supabaseConfigured: true,
    hasSession: true,
    profile: profile as AdminProfileAccess,
  });
}

export async function requireStaffProfile(): Promise<AdminProfileAccess> {
  const gate = await resolveAdminGate();
  if (!gate.ok) {
    throw new Error(adminGateMessage(gate.reason));
  }
  return gate.profile;
}
