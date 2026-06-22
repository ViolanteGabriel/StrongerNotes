import { expect, test } from "@playwright/test";
import { createAuthenticatedUser, loginAndGetToken } from "../helpers/api";
import { seedAuthStorage } from "../helpers/auth";
import { uniqueEmail, uniqueName } from "../helpers/testData";

test("@smoke user can update profile information", async ({ page, request }) => {
  const auth = await createAuthenticatedUser(request);
  const updatedName = uniqueName("E2E Updated Athlete");
  const updatedEmail = uniqueEmail("profile");
  await seedAuthStorage(page, auth);

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: /profile settings/i })).toBeVisible();
  await page.getByLabel(/full name/i).fill(updatedName);
  await page.getByLabel(/^email$/i).fill(updatedEmail);
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByText(/changes saved successfully/i)).toBeVisible();
  await expect(page.getByLabel(/full name/i)).toHaveValue(updatedName);
  await expect(page.getByLabel(/^email$/i)).toHaveValue(updatedEmail);
  await expect.poll(async () => page.evaluate(() => {
    const stored = window.localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored).email as string : null;
  })).toBe(updatedEmail);

  const refreshedAuth = await loginAndGetToken(request, updatedEmail, auth.password);
  expect(refreshedAuth.user.name).toBe(updatedName);

  await page.getByRole("link", { name: /back to dashboard/i }).click();

  await expect(page.getByRole("heading", { name: `Welcome back, ${updatedName}!` })).toBeVisible();
  await expect(page.getByText(updatedEmail)).toBeVisible();
});

test("@smoke user can delete their account", async ({ page, request }) => {
  const auth = await createAuthenticatedUser(request);
  await seedAuthStorage(page, auth);

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: /danger zone/i })).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("permanently delete your account");
    await dialog.accept();
  });
  await page.getByRole("button", { name: /delete account/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("auth_token"))).toBeNull();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("auth_user"))).toBeNull();

  await page.goto("/login");
  await page.getByLabel(/^email$/i).fill(auth.email);
  await page.getByRole("textbox", { name: /^password$/i }).fill(auth.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByText(/invalid e-mail or password/i)).toBeVisible();
});
