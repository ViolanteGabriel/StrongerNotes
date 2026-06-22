import { buildApp } from '../app.js';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { expect } from 'vitest';

export async function createTestApp(): Promise<FastifyInstance> {
  const app = buildApp();
  await app.ready();
  return app;
}

export const DEFAULT_TEST_PASSWORD = 'password123';

let uniqueCounter = 0;

export function uniqueTestName(prefix = 'Test') {
  uniqueCounter += 1;
  return `${prefix} ${Date.now()} ${uniqueCounter}`;
}

export function uniqueTestEmail(prefix = 'user') {
  uniqueCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueCounter}@example.com`;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function expectJsonData<T>(res: LightMyRequestResponse, statusCode: number): T {
  expect(res.statusCode).toBe(statusCode);
  return res.json<{ data: T }>().data;
}

export function expectJsonError(res: LightMyRequestResponse, statusCode: number) {
  expect(res.statusCode).toBe(statusCode);
  return res.json<{ error: string; details?: unknown }>();
}

export interface UserPayload {
  name: string;
  email: string;
  password: string;
}

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

export interface ExercisePayload {
  name: string;
  category: 'strength' | 'cardio';
  muscleGroup: string;
}

export interface Exercise {
  _id: string;
  name: string;
  category: 'strength' | 'cardio';
  muscleGroup: string;
  isCustom: boolean;
  createdBy?: string | null;
}

export interface WorkoutPayload {
  name: string;
  exercises?: string[];
}

export interface Workout {
  _id: string;
  name: string;
  owner: string;
  exercises: Array<string | Exercise>;
}

export interface Session {
  _id: string;
  workout: string | { _id: string; name: string; exercises?: Exercise[] };
  owner: string;
  date: string;
  notes: string | null;
  sets?: WorkoutSet[];
}

export interface SetPayload {
  exerciseId: string;
  order?: number;
  reps?: number | null;
  weightKg?: number | null;
  durationSecs?: number | null;
  restSecs?: number | null;
  notes?: string | null;
}

export interface WorkoutSet {
  _id: string;
  session: string;
  exercise: Exercise;
  order: number;
  reps: number | null;
  weightKg: number | null;
  durationSecs: number | null;
  restSecs: number | null;
  notes: string | null;
}

export interface StrengthProgressPoint {
  date: string;
  maxWeight: number;
  reps: number;
  estimated1RM: number;
}

export interface CardioProgressPoint {
  date: string;
  maxDuration: number;
  restSecs: number | null;
}

export type ProgressPoint = StrengthProgressPoint | CardioProgressPoint;

export interface ExerciseProgress {
  exercise: Exercise;
  data: ProgressPoint[];
}

export function buildUserPayload(overrides: Partial<UserPayload> = {}): UserPayload {
  return {
    name: overrides.name ?? uniqueTestName('Test User'),
    email: overrides.email ?? uniqueTestEmail('user'),
    password: overrides.password ?? DEFAULT_TEST_PASSWORD,
  };
}

export async function createTestUser(app: FastifyInstance, payload: UserPayload = {
  name: 'Test User',
  email: 'test@example.com',
  password: DEFAULT_TEST_PASSWORD,
}) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/users',
    payload,
  });
  return res.json<{ data: AuthUser }>();
}

export async function loginTestUser(app: FastifyInstance, email: string, password: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });
  return res.json<{ data: { token: string; user: AuthUser } }>();
}

export async function createAuthenticatedUser(
  app: FastifyInstance,
  overrides: Partial<UserPayload> = {},
): Promise<TestAuth> {
  const payload = buildUserPayload(overrides);
  const createRes = await app.inject({
    method: 'POST',
    url: '/api/v1/users',
    payload,
  });
  const user = expectJsonData<AuthUser>(createRes, 201);

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: payload.email, password: payload.password },
  });
  const login = expectJsonData<{ token: string; user: AuthUser }>(loginRes, 200);

  return {
    email: payload.email,
    password: payload.password,
    token: login.token,
    user,
  };
}

export async function createExercise(
  app: FastifyInstance,
  token: string,
  payload: Partial<ExercisePayload> = {},
) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/exercises',
    headers: authHeaders(token),
    payload: {
      name: payload.name ?? uniqueTestName('Exercise'),
      category: payload.category ?? 'strength',
      muscleGroup: payload.muscleGroup ?? 'Chest',
    },
  });
  return expectJsonData<Exercise>(res, 201);
}

export async function getExercises(app: FastifyInstance, token: string) {
  const res = await app.inject({
    method: 'GET',
    url: '/api/v1/exercises',
    headers: authHeaders(token),
  });
  return expectJsonData<Exercise[]>(res, 200);
}

export async function createWorkout(
  app: FastifyInstance,
  token: string,
  payload: Partial<WorkoutPayload> = {},
) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/workouts',
    headers: authHeaders(token),
    payload: {
      name: payload.name ?? uniqueTestName('Workout'),
      exercises: payload.exercises ?? [],
    },
  });
  return expectJsonData<Workout>(res, 201);
}

export async function createSession(
  app: FastifyInstance,
  token: string,
  workoutId: string,
  payload: { date?: string; notes?: string | null } = {},
) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/sessions',
    headers: authHeaders(token),
    payload: {
      workoutId,
      ...payload,
    },
  });
  return expectJsonData<Session>(res, 201);
}

export async function createSet(
  app: FastifyInstance,
  token: string,
  sessionId: string,
  payload: SetPayload,
) {
  const res = await app.inject({
    method: 'POST',
    url: `/api/v1/sessions/${sessionId}/sets`,
    headers: authHeaders(token),
    payload,
  });
  return expectJsonData<WorkoutSet>(res, 201);
}

export async function updateSet(
  app: FastifyInstance,
  token: string,
  sessionId: string,
  setId: string,
  payload: Partial<Omit<SetPayload, 'exerciseId'>>,
) {
  const res = await app.inject({
    method: 'PUT',
    url: `/api/v1/sessions/${sessionId}/sets/${setId}`,
    headers: authHeaders(token),
    payload,
  });
  return expectJsonData<WorkoutSet>(res, 200);
}

export async function getSession(app: FastifyInstance, token: string, sessionId: string) {
  const res = await app.inject({
    method: 'GET',
    url: `/api/v1/sessions/${sessionId}`,
    headers: authHeaders(token),
  });
  return expectJsonData<Session>(res, 200);
}
