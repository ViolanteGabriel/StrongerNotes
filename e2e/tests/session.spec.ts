import { expect, test } from "@playwright/test";
import { createAuthenticatedUser, createWorkout, getExerciseByName } from "../helpers/api";
import { seedAuthStorage } from "../helpers/auth";
import { uniqueName } from "../helpers/testData";

test("@smoke user can start a session and log a strength set", async ({ page, request }) => {
  const auth = await createAuthenticatedUser(request);
  const benchPress = await getExerciseByName(request, auth.token, "Bench Press");
  const routine = await createWorkout(request, auth.token, {
    name: uniqueName("E2E Strength Session"),
    exercises: [benchPress._id],
  });
  await seedAuthStorage(page, auth);

  await page.goto(`/workouts/${routine._id}`);
  await page.getByRole("button", { name: /start session/i }).click();

  await expect(page).toHaveURL(/\/sessions\/[a-f0-9]{24}$/i);
  await expect(page.getByRole("heading", { name: routine.name })).toBeVisible();

  await page.getByRole("button", { name: /log set for bench press/i }).click();
  await page.getByLabel(/^reps$/i).fill("5");
  await page.getByLabel(/weight/i).fill("100");
  await page.getByLabel(/rest/i).fill("120");
  await page.getByRole("button", { name: /log set/i }).click();

  await expect(page.getByText(/5 reps.*100 kg.*120s rest/i)).toBeVisible();
  await expect(page.getByLabel("1 set logged")).toBeVisible();
});
