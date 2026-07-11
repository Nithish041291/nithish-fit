import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("user generates a 7-day Indian meal plan", async ({ page }) => {
  await page.goto("/more/meal-plan");
  await waitForAppReady(page);

  await page.getByRole("button", { name: /Generate 7-day plan|Regenerate 7-day plan/ }).click();
  await expect(page.getByText("7-day meal plan generated")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Day 1")).toBeVisible();
  await expect(page.getByText("Day 7")).toBeVisible();
});
