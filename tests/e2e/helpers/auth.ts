import { expect, type Page } from "@playwright/test";

export async function loginAsSeededUser(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("maya@weddingos.local");
  await page.getByPlaceholder("Your password").fill("weddingos-local");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
