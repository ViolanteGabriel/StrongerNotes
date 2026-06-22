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
