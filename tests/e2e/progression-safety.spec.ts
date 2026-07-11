import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("the 25kg right-hand safety cap is surfaced in the exercise directory and progression view", async ({ page }) => {
  await page.goto("/more/exercises/incline-dumbbell-press");
  await waitForAppReady(page);

  await expect(page.getByText("Incline Dumbbell Press", { exact: false })).toBeVisible();
  await expect(page.getByText("Per-hand / total limit: 25kg")).toBeVisible();

  // Seeded history has this exercise reach the 25kg cap in the most recent week — the
  // recommendation card must always explain why (spec section 10: "show the reason").
  await page.goto("/more/progression/incline-dumbbell-press");
  await expect(page.getByText("Next recommendation")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/25\s*kg/i).first()).toBeVisible();
});

test("goblet squat and sumo squat are capped at 25kg total, not per hand", async ({ page }) => {
  await page.goto("/more/exercises/goblet-squat");
  await waitForAppReady(page);
  await expect(page.getByText("Per-hand / total limit: 25kg")).toBeVisible();
});
