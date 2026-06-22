import { expect, test } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import { uniqueName } from "../helpers/testData";

test("@smoke user can create a routine and add Bench Press", async ({ page, request }) => {
  await loginViaApi(page, request);
  const routineName = uniqueName("E2E Push Day");

  await page.goto("/dashboard");
  await page.getByRole("button", { name: /new routine/i }).click();

  await page.getByRole("textbox", { name: /^routine name$/i }).fill(routineName);
  await page.getByRole("button", { name: /save routine name/i }).click();

  await expect(page.getByRole("heading", { name: routineName })).toBeVisible();

  await page.getByRole("button", { name: /^add$/i }).click();
  await page.getByLabel(/search exercises/i).fill("Bench Press");
  await page.getByRole("button", { name: /bench press/i }).click();

  await expect(page.getByText("Bench Press")).toBeVisible();
  await expect(page.getByText(/Chest .* strength/i)).toBeVisible();
});
