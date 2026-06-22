# StrongerNotes E2E Tests

The E2E suite is a small Playwright smoke layer for the most important browser journeys.
It uses its own Docker MongoDB instance on port `27018` and resets the
`strongernotes_e2e` database before each run.

```bash
npm run test:e2e:smoke
```

The suite starts the backend and frontend through Playwright web servers. Do not point
E2E at the normal development database. The normal test scripts clean up the E2E
container and volume when Playwright exits.

## Reports and failure artifacts

Playwright keeps traces, screenshots, and videos only for failed/retried tests. To
inspect the last local HTML report, run:

```bash
npm run test:e2e:report
```

In GitHub Actions, the workflow uploads `playwright-report/` and `test-results/`
only when a check fails. Download both artifacts from the failed run, open the HTML
report, and use the attached traces/videos to replay the browser session.

## Current coverage

The smoke suite covers:

- registration, sign out, and login
- routine creation and adding `Bench Press`
- starting a strength session and logging a set
- custom exercise creation
- cardio duration logging
- progress rendering after logged strength data
