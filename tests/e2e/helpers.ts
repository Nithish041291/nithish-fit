import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Waits past the initial demo-seed + first-load skeleton state. */
export async function waitForAppReady(page: Page) {
  await expect(page.getByText("Local demo mode")).toBeVisible({ timeout: 15_000 });
}
