import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("user starts a workout, logs a set with pain, and completes the session", async ({ page }) => {
  await page.goto("/workout");
  await waitForAppReady(page);

  const startButton = page.getByRole("button", { name: /Start (optional )?workout/ });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // Readiness check-in appears — skip it to get straight into the session.
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skip.click();
  }

  await expect(page).toHaveURL(/\/workout\/session\//, { timeout: 10_000 });

  const setRows = page.getByTestId("set-row");
  const hasSets = await setRows
    .first()
    .waitFor({ state: "visible", timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  if (hasSets) {
    const firstRow = setRows.first();
    await firstRow.getByTestId("set-pain-input").fill("5");
    await firstRow.getByRole("button", { name: "Mark set complete" }).click();
    await expect(page.getByText(/Pain of 4\/10 or higher recorded/)).toBeVisible({ timeout: 5000 });
    await expect(firstRow.getByRole("button", { name: "Completed" })).toBeVisible();
  } else {
    await expect(page.getByText("No exercises are attached to this session")).toBeVisible();
  }

  await page.getByRole("button", { name: "Complete workout" }).click();
  await expect(page.getByText("Session complete")).toBeVisible({ timeout: 10_000 });
});
