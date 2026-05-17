import { expect, test } from "@playwright/test";
import { loginAsSeededUser } from "./helpers/auth";

const coupleRoutes = ["/dashboard", "/marketplace", "/messages", "/budget", "/rsvp", "/timeline", "/planner", "/opportunities"];
const vendorRoutes = ["/vendor/dashboard", "/vendor/leads", "/vendor/messages", "/vendor/opportunities", "/vendor/clients"];

test("primary beta routes fit mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsSeededUser(page);

  for (const route of [...coupleRoutes, ...vendorRoutes]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForFunction(() => {
      const main = document.querySelector("main");
      return Boolean(document.styleSheets.length && main && getComputedStyle(main).paddingLeft !== "0px");
    });
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      return Math.max(root.scrollWidth, body.scrollWidth) - window.innerWidth;
    });
    expect(overflow, `${route} should not horizontally overflow`).toBeLessThanOrEqual(1);
  }
});
