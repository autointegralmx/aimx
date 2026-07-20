import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd());

describe("env and seed safety", () => {
  it("does not expose service role via NEXT_PUBLIC_", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    expect(example).not.toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/);
    expect(example).toMatch(/SUPABASE_SERVICE_ROLE_KEY=/);
    expect(example).toMatch(/NEXT_PUBLIC_SUPABASE_URL=/);
    expect(example).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY=/);
    expect(example).toMatch(/NEXT_PUBLIC_WHATSAPP_NUMBER=/);
  });

  it("browser and middleware clients use anon key only", () => {
    const browser = readFileSync(
      join(root, "src/shared/lib/supabase/browser.ts"),
      "utf8",
    );
    const middleware = readFileSync(
      join(root, "src/shared/lib/supabase/middleware.ts"),
      "utf8",
    );
    const server = readFileSync(
      join(root, "src/shared/lib/supabase/server.ts"),
      "utf8",
    );
    const env = readFileSync(join(root, "src/shared/lib/supabase/env.ts"), "utf8");
    for (const source of [browser, middleware, server, env]) {
      expect(source).not.toMatch(/SERVICE_ROLE/);
    }
    expect(env).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(env).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(browser).toMatch(/requirePublicSupabaseEnv/);
    expect(server).toMatch(/requirePublicSupabaseEnv/);
  });

  it("keeps local seed users out of migrations", () => {
    const dir = join(root, "supabase/migrations");
    const files = readdirSync(dir).filter((name) => name.endsWith(".sql"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      expect(sql).not.toMatch(/admin@autointegral\.local/);
      expect(sql).not.toMatch(/editor@autointegral\.local/);
      expect(sql).not.toMatch(/AdminLocal123!/);
      expect(sql).not.toMatch(/EditorLocal123!/);
    }
  });

  it("documents seed-only local demo users", () => {
    const seed = readFileSync(join(root, "supabase/seed.sql"), "utf8");
    expect(seed).toMatch(/admin@autointegral\.local/);
    expect(seed).toMatch(/editor@autointegral\.local/);
  });
});
