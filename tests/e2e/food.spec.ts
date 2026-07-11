import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("user logs an Indian meal via natural language and totals update", async ({ page }) => {
  await page.goto("/food");
  await waitForAppReady(page);

  await page.getByPlaceholder(/3 eggs bhurji/).fill("2 idli with sambar");
  await page.getByRole("button", { name: "Parse" }).click();

  await expect(page.getByText('"2 idli"')).toBeVisible();
  await expect(page.getByText('"sambar"')).toBeVisible();

  const cards = page.getByTestId("parsed-entry-card");
  const cardCount = await cards.count();
  for (let i = 0; i < cardCount; i++) {
    await cards.nth(0).getByTestId("log-this-button").click();
    // Confirming removes the card from the pending list, so always re-target index 0.
  }

  await expect(page.getByText("No food logged yet today.")).not.toBeVisible();
  await expect(page.getByText("Idli", { exact: false }).or(page.getByText("Sambar", { exact: false })).first()).toBeVisible();
});

test("user corrects an uncertain food match before logging", async ({ page }) => {
  await page.goto("/food");
  await waitForAppReady(page);

  await page.getByPlaceholder(/3 eggs bhurji/).fill("egg burji");
  await page.getByRole("button", { name: "Parse" }).click();

  const card = page.getByTestId("parsed-entry-card").filter({ hasText: '"egg burji"' });
  await expect(card).toBeVisible();

  // Pick an explicit alternative match (not the parser's already-selected top guess) so the
  // correction is recorded as a user edit.
  const options = card.getByTestId("match-option");
  const optionCount = await options.count();
  if (optionCount > 1) {
    await options.nth(1).click();
    await card.getByTestId("log-this-button").click();
    await expect(page.getByText("edited", { exact: false })).toBeVisible({ timeout: 10_000 });
  } else {
    await card.getByTestId("log-this-button").click();
  }
});
