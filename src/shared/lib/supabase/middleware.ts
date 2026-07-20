import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  evaluateAdminAccess,
  type AdminProfileAccess,
} from "@/modules/admin/domain/admin-access";
import { readPublicSupabaseEnv } from "@/shared/lib/supabase/env";

/**
 * Session refresh + admin access gate.
 * Requires active admin_profiles with role admin|editor.
 * Does not bypass when env vars are missing.
 */
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (!isAdminRoute) {
    return NextResponse.next({ request });
  }

  const env = readPublicSupabaseEnv();

  if (!env.configured) {
    if (isLoginRoute) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "missing_config");
      return NextResponse.rewrite(loginUrl);
    }
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("error", "missing_config");
    return NextResponse.redirect(redirectUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url!, env.anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isLoginRoute) {
    if (!user) {
      return supabaseResponse;
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

    if (gate.ok) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Authenticated but not staff — force login with reason (session may remain; layout/login will sign out).
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("error", gate.reason);
    return NextResponse.redirect(redirectUrl);
  }

  // Protected /admin/*
  if (!user) {
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    redirectUrl.searchParams.set("error", "no_session");
    return NextResponse.redirect(redirectUrl);
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
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("error", gate.reason);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
