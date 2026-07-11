import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("user records body weight and the progress chart/stats update", async ({ page }) => {
  await page.goto("/progress");
  await waitForAppReady(page);

  await expect(page.getByText("7-day average")).toBeVisible();

  await page.getByRole("button", { name: "Log weight" }).click();
  await page.getByLabel("Weight (kg)").fill("91.5");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("91.5 kg")).toBeVisible({ timeout: 10_000 });
});
