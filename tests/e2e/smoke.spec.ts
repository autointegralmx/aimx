import { test, expect } from "@playwright/test";

/**
 * Critical-path E2E will be enabled once Supabase local + admin seed exist.
 * This smoke keeps Playwright wired without requiring Docker in CI yet.
 */
test.describe("public smoke", () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL && !process.env.CI,
    "Start the app (pnpm dev) and set PLAYWRIGHT_BASE_URL to run.",
  );

  test("home renders brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Auto Integral" }).first()).toBeVisible();
  });
});
