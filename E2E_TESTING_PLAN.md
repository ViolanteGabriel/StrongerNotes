# E2E Testing Implementation Plan

## Summary

StrongerNotes uses E2E tests as a small smoke/regression layer, not as a replacement for backend integration tests or frontend component tests. This follows the testing-pyramid guidance in `testes.md`: most rules and edge cases stay in lower-level tests, while Playwright protects the highest-value full user journeys.

The first milestone is intentionally small:

1. User can register, sign out, and login.
2. User can create a routine and add `Bench Press`.
3. User can start a session and log a strength set.

## Architecture

- Playwright lives at the repository root.
- Tests live in `e2e/tests`.
- Shared setup helpers live in `e2e/helpers`.
- Playwright starts the backend and frontend through `webServer` entries in `playwright.config.ts`.
- E2E does not use `start.sh`; that script is for interactive local development.
- E2E uses a dedicated Docker MongoDB on port `27018` with database `strongernotes_e2e`.
- `e2e/scripts/prepare-db.sh` starts MongoDB, waits for readiness, and drops the E2E database before a run.
- `e2e/scripts/run-playwright.sh` runs Playwright and removes the E2E container/volume when the run exits.

## Test Data Strategy

- Every test creates unique users and routine names.
- Browser tests arrange setup data through API helpers, then act and assert through the UI.
- Auth helpers seed the same local storage keys used by the app: `auth_token` and `auth_user`.
- Seeded public exercises are loaded by the backend at startup; smoke tests use `Bench Press`.
- The E2E database may be reset freely and must never point to development or production data.

## Current Smoke Tests

- `auth.spec.ts`: register through UI, reach dashboard, sign out, login through UI, reach dashboard again.
- `workout.spec.ts`: authenticate through API, create a routine through UI, add seeded `Bench Press`, and assert it appears.
- `session.spec.ts`: authenticate through API, create a workout with `Bench Press`, start a session through UI, log `5 reps`, `100 kg`, and `120s rest`.

## Lower-Level Tests

- Backend Vitest tests use `mongodb-memory-server`.
- Frontend Jest tests remain responsible for component/auth route behavior.
- Validation rules, JWT behavior, permission checks, progress math, API response shape, and edge cases should stay out of E2E unless they break a critical user journey.

## Commands

```bash
npm run test:front
npm run test:back
npm run test:e2e:smoke
npm run test:e2e
npm run test:e2e:ui
```

## CI

GitHub Actions installs root, backend, and frontend dependencies, installs Playwright Chromium, runs frontend tests, runs backend tests, then runs the E2E smoke suite. Playwright reports and test artifacts are uploaded on every run for debugging.

## Future E2E Coverage

Add these only after the smoke layer is stable:

- Custom exercise creation.
- Cardio duration logging.
- Progress chart rendering.
- Profile edit.
- Account deletion.

Do not grow the E2E suite blindly. A small reliable suite is better than a large flaky one.
