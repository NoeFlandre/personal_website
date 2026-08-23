import { defineConfig } from "@playwright/test";

const desktopViewport = { width: 1280, height: 900 };
const mobileViewport = { width: 390, height: 844 };

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.mjs",
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "coverage/playwright",
  reporter: "list",
  projects: [
    { name: "desktop-dark", use: { viewport: desktopViewport, colorScheme: "dark" } },
    { name: "desktop-light", use: { viewport: desktopViewport, colorScheme: "light" } },
    { name: "mobile-dark", use: { viewport: mobileViewport, colorScheme: "dark" } },
    { name: "mobile-light", use: { viewport: mobileViewport, colorScheme: "light" } },
  ],
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
