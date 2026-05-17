import { expect, test } from "@playwright/test";
import { createInvite, deleteUserByEmail, prisma } from "./helpers/db";

test.describe("invite-only beta onboarding", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("protects product routes without a session", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });

  test("signs up a couple owner with an invite", async ({ page }) => {
    const stamp = Date.now();
    const code = `PW-COUPLE-${stamp}`;
    const email = `couple-${stamp}@weddingos.local`;
    await deleteUserByEmail(email);
    await createInvite(code, "COUPLE_OWNER");

    await page.goto(`/signup?code=${code}`);
    await page.getByLabel("Your name").fill("Priya Shah");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("local-beta-pass");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Couple names").fill(`Priya & Dev ${stamp}`);
    await page.getByPlaceholder("Wedding location").fill("Toronto, Ontario");
    await page.getByPlaceholder("Wedding style").fill("Modern fusion");
    await page.getByPlaceholder("Budget").fill("42000");
    await page.getByPlaceholder("Guest estimate").fill("140");
    await page.getByRole("button", { name: "Continue" }).click();
    const coupleCreate = page.getByRole("button", { name: "Create account" });
    if (await coupleCreate.isVisible({ timeout: 1000 }).catch(() => false)) {
      await coupleCreate.click();
    }

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(`Priya & Dev ${stamp}`, { exact: false })).toBeVisible();
  });

  test("signs up a vendor owner with an invite", async ({ page }) => {
    const stamp = Date.now();
    const code = `PW-VENDOR-${stamp}`;
    const email = `vendor-${stamp}@weddingos.local`;
    await deleteUserByEmail(email);
    await createInvite(code, "VENDOR_OWNER");

    await page.goto(`/signup?code=${code}`);
    await page.getByLabel("Your name").fill("Nadia Khan");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("local-beta-pass");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Business name").fill(`Nadia Events ${stamp}`);
    await page.getByPlaceholder("Service location").fill("Toronto, Ontario");
    await page.getByPlaceholder("Primary service").fill("Event design");
    await page.getByPlaceholder("Starting price").fill("3500");
    await page.getByPlaceholder("Short business description").fill("Full-service design studio for modern weddings.");
    await page.getByRole("button", { name: "Continue" }).click();
    const vendorCreate = page.getByRole("button", { name: "Create account" });
    if (await vendorCreate.isVisible({ timeout: 1000 }).catch(() => false)) {
      await vendorCreate.click();
    }

    await expect(page).toHaveURL(/\/vendor\/dashboard/);
    await expect(page.getByText(`Nadia Events ${stamp}`, { exact: false })).toBeVisible();
  });
});
