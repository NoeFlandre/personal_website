import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import playwrightConfig from "../playwright.config.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const workflow = readFileSync(
  new URL("../.github/workflows/astro-build.yml", import.meta.url),
  "utf8"
);

test("browser smoke tests have a production-preview command", () => {
  assert.equal(packageJson.scripts["test:e2e:browser"], "playwright test");
  assert.equal(packageJson.scripts["test:e2e"], "npm run build:check && npm run test:e2e:browser");
  assert.equal(packageJson.devDependencies["@playwright/test"] !== undefined, true);
  assert.equal(packageJson.devDependencies["@axe-core/playwright"] !== undefined, true);

  const configPath = new URL("../playwright.config.mjs", import.meta.url);
  assert.equal(existsSync(configPath), true, "playwright.config.mjs should exist");

  const config = readFileSync(configPath, "utf8");
  assert.match(config, /npm run preview/);
  assert.match(config, /127\.0\.0\.1:4321/);
  assert.match(config, /retain-on-failure/);
  for (const project of ["desktop-dark", "desktop-light", "mobile-dark", "mobile-light"]) {
    assert.match(config, new RegExp(`name: ["']${project}["']`));
  }

  const projects = Object.fromEntries(
    playwrightConfig.projects.map((project) => [project.name, project])
  );
  assert.equal(projects["desktop-dark"].testMatch, undefined);
  for (const project of ["desktop-light", "mobile-dark", "mobile-light"]) {
    assert.deepEqual(projects[project].testMatch, "**/accessibility.spec.mjs");
  }
});

test("Astro CI installs Chromium and runs the browser smoke suite", () => {
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  assert.match(workflow, /run: npm run test:e2e:browser/);
  assert.doesNotMatch(workflow, /run: npm run test:e2e$/m);
});
