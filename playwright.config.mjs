import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.mjs",
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "coverage/playwright",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    colorScheme: "dark",
    permissions: ["clipboard-read", "clipboard-write"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:4321",
  },
});
