import { chromium, devices } from "@playwright/test";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../docs/screenshots");
const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3011";
const email = process.env.SMOKE_ADMIN_EMAIL ?? "";
const password = process.env.SMOKE_ADMIN_PASSWORD ?? "";

if (!email || !password) {
  console.error("Set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD");
  process.exit(1);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 });

  await page.goto(`${base}/admin/vehiculos`, { waitUntil: "networkidle" });
  const actions = page.getByRole("button", { name: /acciones/i }).first();
  await actions.click();
  await page.getByRole("link", { name: /^editar$/i }).first().click();
  await page.waitForURL(/\/editar/, { timeout: 20000 });
  await page.getByText("Estado operativo").waitFor({ timeout: 15000 });

  const desktopPath = path.join(outDir, "admin-vehicle-form-desktop.png");
  await page.screenshot({ path: desktopPath, fullPage: true });

  const mobileContext = await browser.newContext({
    ...devices["iPhone 13"],
    storageState: await context.storageState(),
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto(page.url(), { waitUntil: "networkidle" });
  await mobile.getByText("Estado operativo").waitFor({ timeout: 15000 });
  const mobilePath = path.join(outDir, "admin-vehicle-form-mobile.png");
  await mobile.screenshot({ path: mobilePath, fullPage: true });

  await browser.close();
  console.log("ok desktop");
  console.log("ok mobile");
}

main().catch((error) => {
  console.error(String(error?.message ?? error));
  process.exit(1);
});
