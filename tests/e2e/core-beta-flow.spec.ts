import { expect, test } from "@playwright/test";
import { loginAsSeededUser } from "./helpers/auth";

test.describe("local beta couple and vendor workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeededUser(page);
  });

  test("manages RSVP, budget, timeline, opportunities, and vendor pitches", async ({ page }) => {
    const stamp = Date.now();

    await page.goto("/rsvp");
    await page.getByRole("button", { name: "Add guest" }).click();
    await page.getByPlaceholder("Guest name").fill(`E2E Guest ${stamp}`);
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(`guest-${stamp}@weddingos.local`);
    await page.getByRole("textbox", { name: "Phone", exact: true }).fill("555-0100");
    await page.getByRole("textbox", { name: "Group", exact: true }).fill("E2E Friends");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("article").filter({ hasText: `E2E Guest ${stamp}` }).first()).toBeVisible();
    await page.getByLabel(`Edit E2E Guest ${stamp}`).click();
    await page.getByPlaceholder("Meal choice").fill("Vegetarian");
    await page.getByRole("button", { name: `Save E2E Guest ${stamp}` }).click();
    await expect(page.locator("article").filter({ hasText: `E2E Guest ${stamp}` }).getByText("Meal: Vegetarian", { exact: false })).toBeVisible();

    await page.goto("/budget");
    await page.getByPlaceholder("Budget item").fill(`E2E Decor Reserve ${stamp}`);
    await page.getByLabel("Budget category").selectOption({ label: "Decor" });
    await page.getByPlaceholder("Amount").fill("1250");
    await page.getByRole("button", { name: "Add budget item" }).click();
    await expect(page.getByText(`E2E Decor Reserve ${stamp}`)).toBeVisible();
    await page.getByLabel(`Add payment schedule for E2E Decor Reserve ${stamp}`).click();
    await expect(page.getByText(`Payment schedule added for E2E Decor Reserve ${stamp}.`)).toBeVisible();
    await page.getByLabel(`Add invoice for E2E Decor Reserve ${stamp}`).click();
    await expect(page.getByText(`Invoice record added for E2E Decor Reserve ${stamp}.`)).toBeVisible();

    await page.goto("/timeline");
    await page.getByPlaceholder("New task").fill(`E2E Confirm ceremony cue ${stamp}`);
    await page.getByPlaceholder("Group").fill("E2E Week");
    await page.getByRole("button", { name: "Add timeline task" }).click();
    await expect(page.getByText(`E2E Confirm ceremony cue ${stamp}`)).toBeVisible();
    const taskCard = page.locator("article").filter({ hasText: `E2E Confirm ceremony cue ${stamp}` }).first();
    await taskCard.getByLabel(`Edit E2E Confirm ceremony cue ${stamp}`).click();
    await page.getByLabel(`Task title E2E Confirm ceremony cue ${stamp}`).fill(`E2E Confirm vendor cue ${stamp}`);
    await page.getByRole("button", { name: `Save E2E Confirm ceremony cue ${stamp}` }).click();
    await expect(page.getByText(`E2E Confirm vendor cue ${stamp}`)).toBeVisible();

    await page.goto("/opportunities");
    await page.getByPlaceholder("Need title").fill(`E2E Content Creator ${stamp}`);
    await page.getByPlaceholder("Budget").fill("1800");
    await page.getByPlaceholder("Describe what you need").fill("Looking for behind-the-scenes social content for the wedding weekend.");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText(`E2E Content Creator ${stamp}`)).toBeVisible();

    await page.goto("/vendor/opportunities");
    const card = page.locator("article").filter({ hasText: `E2E Content Creator ${stamp}` }).first();
    await expect(card).toBeVisible();
    await card.getByPlaceholder("Pitch this couple").fill("Golden Lens can cover short-form social content and coordinate with the photo team.");
    await card.getByRole("button", { name: "Send pitch" }).click();
    await expect(card.getByText("Pitch sent")).toBeVisible();
  });
});
