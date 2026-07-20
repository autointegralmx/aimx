import { afterEach, describe, expect, it } from "vitest";
import { getShareImageUrl, getSiteOrigin } from "@/shared/config/site";

describe("getSiteOrigin", () => {
  const keys = [
    "NEXT_PUBLIC_SITE_URL",
    "VERCEL_ENV",
    "VERCEL_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ] as const;
  const backup = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of keys) {
      const value = backup.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    backup.clear();
  });

  function setEnv(partial: Partial<Record<(typeof keys)[number], string>>) {
    for (const key of keys) {
      backup.set(key, process.env[key]);
      const next = partial[key];
      if (next === undefined) delete process.env[key];
      else process.env[key] = next;
    }
  }

  it("uses production domain on Vercel production even if SITE_URL is localhost", () => {
    setEnv({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "autointegral.mx",
      VERCEL_URL: "aimx-preview.vercel.app",
    });
    expect(getSiteOrigin()).toBe("https://autointegral.mx");
  });

  it("never prefers ephemeral vercel.app over production host", () => {
    setEnv({
      VERCEL_ENV: "production",
      VERCEL_URL: "aimx-kjhdu86zw-autointegral.vercel.app",
    });
    expect(getSiteOrigin()).toBe("https://autointegral.mx");
  });

  it("builds absolute share image on production host", () => {
    setEnv({
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "autointegral.mx",
    });
    expect(getShareImageUrl()).toBe("https://autointegral.mx/og-share.png");
  });
});
