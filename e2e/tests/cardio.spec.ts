import { expect, test } from "@playwright/test";
import { createAuthenticatedUser, createWorkout, getExerciseByName } from "../helpers/api";
import { seedAuthStorage } from "../helpers/auth";
import { uniqueName } from "../helpers/testData";

test("@smoke user can log a cardio duration", async ({ page, request }) => {
  const auth = await createAuthenticatedUser(request);
  const treadmillRun = await getExerciseByName(request, auth.token, "Treadmill Run");
  const routine = await createWorkout(request, auth.token, {
    name: uniqueName("E2E Cardio Session"),
    exercises: [treadmillRun._id],
  });
  await seedAuthStorage(page, auth);

  await page.goto(`/workouts/${routine._id}`);
  await page.getByRole("button", { name: /start session/i }).click();

  await expect(page.getByRole("heading", { name: routine.name })).toBeVisible();

  await page.getByRole("button", { name: /log set/i }).click();
  await page.getByLabel(/duration/i).fill("900");
  await page.getByLabel(/rest/i).fill("60");
  await page.getByRole("button", { name: /log set/i }).click();

  await expect(page.getByText(/900s.*60s rest/i)).toBeVisible();
  await expect(page.getByLabel("1 set logged")).toBeVisible();
});
