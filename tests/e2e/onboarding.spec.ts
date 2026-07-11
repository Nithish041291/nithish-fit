import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./helpers";

test("first-time load seeds the profile and shows the Today dashboard", async ({ page }) => {
  await page.goto("/");
  await waitForAppReady(page);

  // Redirects to /today and shows nutrition targets derived from the seeded profile.
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText("2250 kcal remaining")).toBeVisible();
  await expect(page.getByText("/ 180g", { exact: false })).toBeVisible();

  // Bottom navigation is present for all five tabs.
  const nav = page.getByRole("navigation", { name: "Primary" });
  for (const label of ["Today", "Workout", "Food", "Progress", "More"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
});

test("user can view and edit their profile in Settings", async ({ page }) => {
  await page.goto("/more/settings");
  await waitForAppReady(page);

  const nameInput = page.locator("input[name='name']");
  await expect(nameInput).toHaveValue("Nithish");

  const ageInput = page.locator("input[name='age']");
  await expect(ageInput).toHaveValue("35");

  await ageInput.fill("36");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 10_000 });
});
