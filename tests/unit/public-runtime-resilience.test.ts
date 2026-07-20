import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readPublicSupabaseEnv,
  requirePublicSupabaseEnv,
} from "@/shared/lib/supabase/env";

describe("public supabase env", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalAnon === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    }
    vi.restoreAllMocks();
  });

  it("reports missing variables without exposing values", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const env = readPublicSupabaseEnv();
    expect(env.configured).toBe(false);
    expect(env.url).toBeNull();
    expect(env.anonKey).toBeNull();
    expect(() => requirePublicSupabaseEnv()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("trims configured values", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = " https://example.supabase.co ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = " anon-key ";
    const env = readPublicSupabaseEnv();
    expect(env.configured).toBe(true);
    expect(env.url).toBe("https://example.supabase.co");
    expect(env.anonKey).toBe("anon-key");
  });
});

describe("home inventory degradation", () => {
  it("returns empty sections when supabase env is missing", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { loadHomeInventoryData } = await import(
      "@/modules/inventory/application/public-queries"
    );
    const data = await loadHomeInventoryData();
    expect(data.degraded).toBe(true);
    expect(data.opportunities).toEqual([]);
    expect(data.featured).toEqual([]);

    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalAnon === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    }
  });
});
