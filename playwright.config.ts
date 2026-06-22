import { defineConfig, devices } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:3333";
const appBaseUrl = "http://127.0.0.1:5173";
const e2eMongoUri = "mongodb://127.0.0.1:27018/strongernotes_e2e";
const jwtSecret = "e2e_secret_key_must_be_at_least_32_characters";

export default defineConfig({
  testDir: "./e2e/tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: appBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: [
        "bash e2e/scripts/prepare-db.sh",
        [
          "NODE_ENV=dev",
          "PORT=3333",
          `MONGODB_URI=${e2eMongoUri}`,
          `JWT_SECRET=${jwtSecret}`,
          "npm run dev --prefix back",
        ].join(" "),
      ].join(" && "),
      url: `${apiBaseUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: [
        `VITE_API_URL=${apiBaseUrl}`,
        "npm run dev --prefix front -- --host 127.0.0.1 --port 5173 --strictPort",
      ].join(" "),
      url: appBaseUrl,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
