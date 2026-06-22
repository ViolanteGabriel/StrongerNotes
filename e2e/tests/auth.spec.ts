import { expect, test } from "@playwright/test";
import { DEFAULT_PASSWORD, uniqueEmail, uniqueName } from "../helpers/testData";

test("@smoke user can register, sign out, and login", async ({ page }) => {
  const email = uniqueEmail();
  const name = uniqueName("E2E Auth User");

  await page.goto("/register");

  await page.getByLabel(/full name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(DEFAULT_PASSWORD);
  await page.getByRole("button", { name: /get started/i }).click();

  await expect(page.getByRole("heading", { name: /training dashboard/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: new RegExp(`Welcome back, ${name}!`) })).toBeVisible();

  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(DEFAULT_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByRole("heading", { name: /training dashboard/i })).toBeVisible();
});
