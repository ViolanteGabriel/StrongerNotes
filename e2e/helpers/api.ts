import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";
import { DEFAULT_PASSWORD, uniqueEmail, uniqueName } from "./testData";

const API_BASE_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3333";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
}

export interface TestAuth {
  email: string;
  password: string;
  token: string;
  user: AuthUser;
}

export interface Exercise {
  _id: string;
  name: string;
  category: "strength" | "cardio";
  muscleGroup: string;
  isCustom?: boolean;
}

export interface Workout {
  _id: string;
  name: string;
  exercises: Exercise[];
}

export interface Session {
  _id: string;
  workout: string;
  owner: string;
  date: string;
  notes: string | null;
}

export interface WorkoutSet {
  _id: string;
  reps: number | null;
  weightKg: number | null;
  durationSecs: number | null;
  restSecs: number | null;
  notes: string | null;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function expectJsonData<T>(response: APIResponse, status: number) {
  expect(response.status()).toBe(status);
  const body = await response.json() as { data: T };
  return body.data;
}

export async function createTestUser(
  request: APIRequestContext,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  const payload = {
    name: overrides.name ?? uniqueName("E2E User"),
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? DEFAULT_PASSWORD,
  };

  const response = await request.post(`${API_BASE_URL}/api/v1/users`, { data: payload });
  const user = await expectJsonData<AuthUser>(response, 201);

  return { user, email: payload.email, password: payload.password };
}

export async function loginAndGetToken(request: APIRequestContext, email: string, password = DEFAULT_PASSWORD) {
  const response = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
    data: { email, password },
  });

  return expectJsonData<{ token: string; user: AuthUser }>(response, 200);
}

export async function createAuthenticatedUser(request: APIRequestContext): Promise<TestAuth> {
  const created = await createTestUser(request);
  const login = await loginAndGetToken(request, created.email, created.password);

  return {
    email: created.email,
    password: created.password,
    token: login.token,
    user: login.user,
  };
}

export async function getExercises(request: APIRequestContext, token: string) {
  const response = await request.get(`${API_BASE_URL}/api/v1/exercises`, {
    headers: authHeaders(token),
  });

  return expectJsonData<Exercise[]>(response, 200);
}

export async function getExerciseByName(request: APIRequestContext, token: string, name: string) {
  const exercises = await getExercises(request, token);
  const exercise = exercises.find((item) => item.name === name);

  if (!exercise) {
    throw new Error(`Expected seeded exercise "${name}" to exist.`);
  }

  return exercise;
}

export async function createExercise(
  request: APIRequestContext,
  token: string,
  payload: { name: string; category: "strength" | "cardio"; muscleGroup: string },
) {
  const response = await request.post(`${API_BASE_URL}/api/v1/exercises`, {
    headers: authHeaders(token),
    data: payload,
  });

  return expectJsonData<Exercise>(response, 201);
}

export async function createWorkout(
  request: APIRequestContext,
  token: string,
  payload: { name?: string; exercises?: string[] } = {},
) {
  const response = await request.post(`${API_BASE_URL}/api/v1/workouts`, {
    headers: authHeaders(token),
    data: {
      name: payload.name ?? uniqueName("E2E Routine"),
      exercises: payload.exercises ?? [],
    },
  });

  return expectJsonData<Workout>(response, 201);
}

export async function createSession(
  request: APIRequestContext,
  token: string,
  workoutId: string,
  date?: string,
) {
  const response = await request.post(`${API_BASE_URL}/api/v1/sessions`, {
    headers: authHeaders(token),
    data: date ? { workoutId, date } : { workoutId },
  });

  return expectJsonData<Session>(response, 201);
}

export async function createSet(
  request: APIRequestContext,
  token: string,
  sessionId: string,
  payload: {
    exerciseId: string;
    order?: number;
    reps?: number | null;
    weightKg?: number | null;
    durationSecs?: number | null;
    restSecs?: number | null;
    notes?: string | null;
  },
) {
  const response = await request.post(`${API_BASE_URL}/api/v1/sessions/${sessionId}/sets`, {
    headers: authHeaders(token),
    data: payload,
  });

  return expectJsonData<WorkoutSet>(response, 201);
}

export async function deleteTestUser(request: APIRequestContext, auth: TestAuth) {
  const response = await request.delete(`${API_BASE_URL}/api/v1/users/${auth.user._id}`, {
    headers: authHeaders(auth.token),
  });

  expect(response.status()).toBe(204);
}
