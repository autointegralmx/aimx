export type AdminRole = "admin" | "editor";

export type AdminProfileAccess = {
  id: string;
  role: AdminRole;
  is_active: boolean;
};

export type AdminGateDenialReason =
  | "missing_config"
  | "no_session"
  | "no_profile"
  | "inactive"
  | "forbidden_role";

export type AdminGateResult =
  | { ok: true; profile: AdminProfileAccess }
  | { ok: false; reason: AdminGateDenialReason };

const ALLOWED_ROLES: readonly AdminRole[] = ["admin", "editor"];

/**
 * Pure gate decision — unit-testable without Next/Supabase.
 * Session existence is checked by the caller (pass null profile + hasSession).
 */
export function evaluateAdminAccess(input: {
  supabaseConfigured: boolean;
  hasSession: boolean;
  profile: AdminProfileAccess | null;
}): AdminGateResult {
  if (!input.supabaseConfigured) {
    return { ok: false, reason: "missing_config" };
  }
  if (!input.hasSession) {
    return { ok: false, reason: "no_session" };
  }
  if (!input.profile) {
    return { ok: false, reason: "no_profile" };
  }
  if (!input.profile.is_active) {
    return { ok: false, reason: "inactive" };
  }
  if (!ALLOWED_ROLES.includes(input.profile.role)) {
    return { ok: false, reason: "forbidden_role" };
  }
  return { ok: true, profile: input.profile };
}

export function adminGateMessage(reason: AdminGateDenialReason): string {
  switch (reason) {
    case "missing_config":
      return "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY, inicia Docker y ejecuta supabase start.";
    case "no_session":
      return "Debes iniciar sesión.";
    case "no_profile":
      return "Tu cuenta no tiene perfil de administrador.";
    case "inactive":
      return "Tu acceso administrativo está inactivo.";
    case "forbidden_role":
      return "Tu rol no tiene permiso para el panel.";
  }
}
