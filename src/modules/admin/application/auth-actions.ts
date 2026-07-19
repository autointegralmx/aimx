"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import {
  adminGateMessage,
  evaluateAdminAccess,
  type AdminProfileAccess,
} from "@/modules/admin/domain/admin-access";
import { isSupabaseConfigured } from "@/modules/admin/application/require-staff";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().startsWith("/admin").optional(),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return { error: adminGateMessage("missing_config") };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || "/admin",
  });

  if (!parsed.success) {
    return { error: "Revisa correo y contraseña." };
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { error: adminGateMessage("missing_config") };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "No pudimos iniciar sesión. Verifica tus credenciales." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: adminGateMessage("no_session") };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const gate = evaluateAdminAccess({
    supabaseConfigured: true,
    hasSession: true,
    profile: (profile as AdminProfileAccess | null) ?? null,
  });

  if (!gate.ok) {
    await supabase.auth.signOut();
    return { error: adminGateMessage(gate.reason) };
  }

  redirect(parsed.data.next ?? "/admin");
}

export async function logoutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=missing_config");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
