import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("user exports a full JSON backup", async ({ page }) => {
  await page.goto("/more/export");
  await waitForAppReady(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download full JSON backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/nithish-fit-backup-.*\.json/);
});

test("user exports body weight CSV for a date range", async ({ page }) => {
  await page.goto("/more/export");
  await waitForAppReady(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Body weight CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/nithish-fit-body-weight-.*\.csv/);
});
