import { expect, test } from "@playwright/test";
import {
  createAuthenticatedUser,
  createSession,
  createSet,
  createWorkout,
  getExerciseByName,
} from "../helpers/api";
import { seedAuthStorage } from "../helpers/auth";
import { uniqueName } from "../helpers/testData";

test("@smoke user can view progress after logging strength data", async ({ page, request }) => {
  const auth = await createAuthenticatedUser(request);
  const benchPress = await getExerciseByName(request, auth.token, "Bench Press");
  const routine = await createWorkout(request, auth.token, {
    name: uniqueName("E2E Progress Routine"),
    exercises: [benchPress._id],
  });
  const firstSession = await createSession(request, auth.token, routine._id, "2026-06-20T12:00:00.000Z");
  const secondSession = await createSession(request, auth.token, routine._id, "2026-06-21T12:00:00.000Z");

  await createSet(request, auth.token, firstSession._id, {
    exerciseId: benchPress._id,
    order: 0,
    reps: 5,
    weightKg: 100,
    restSecs: 120,
  });
  await createSet(request, auth.token, secondSession._id, {
    exerciseId: benchPress._id,
    order: 0,
    reps: 3,
    weightKg: 110,
    restSecs: 150,
  });
  await seedAuthStorage(page, auth);

  await page.goto(`/exercises/${benchPress._id}/progress`);

  await expect(page.getByRole("heading", { name: /bench press/i })).toBeVisible();
  await expect(page.getByText("Best Est. 1RM")).toBeVisible();
  await expect(page.getByRole("cell", { name: "121 kg" })).toBeVisible();
  await expect(page.getByTestId("exercise-progress-chart")).toBeVisible();
  await expect(page.getByRole("table", { name: /bench press progress history/i })).toBeVisible();
  await expect(page.getByRole("cell", { name: "110 kg" })).toBeVisible();
});
