import { expect, test } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import { uniqueName } from "../helpers/testData";

test("@smoke user can create a custom exercise", async ({ page, request }) => {
  await loginViaApi(page, request);
  const exerciseName = uniqueName("E2E Cable Fly");

  await page.goto("/exercises");
  await page.getByRole("button", { name: /new exercise/i }).click();

  await page.getByLabel(/^name$/i).fill(exerciseName);
  await page.getByLabel(/category/i).selectOption("strength");
  await page.getByLabel(/muscle group/i).fill("Chest");
  await page.getByRole("button", { name: /create exercise/i }).click();

  await expect(page.getByText(exerciseName)).toBeVisible();
  await expect(page.getByText("custom")).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`View progress for ${exerciseName}`, "i") })).toBeVisible();
});
