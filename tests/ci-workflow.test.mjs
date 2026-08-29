import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/astro-build.yml", import.meta.url),
  "utf8"
);
const runCommands = [...workflow.matchAll(/^\s*run:\s*(.+)$/gm)].map((match) => match[1].trim());

test("Astro CI builds once and reuses the artifact for browser tests", () => {
  assert.equal(runCommands.includes("npm run test:e2e:browser"), true);
  assert.equal(runCommands.includes("npm run test:e2e"), false);
  assert.equal(runCommands.includes("npm run build:check"), true);
  assert.equal(runCommands.includes("npm run astro -- check"), false);
  assert.equal(runCommands.includes("npm run build"), false);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /actions\/download-artifact@v4/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /actions\/cache@v4/);
  assert.match(workflow, /path: ~\/\.cache\/ms-playwright/);
  assert.match(
    workflow,
    /key: playwright-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/
  );
});

test("Astro CI runs the complete quality gate in its own job", () => {
  assert.equal(
    runCommands.includes("npm run check && npm run test:coverage && npm run test:crap:report"),
    true
  );
  assert.equal(runCommands.includes("npm run test:quality"), false);
  assert.equal(runCommands.includes("npm run test:mutation"), false);
  assert.match(workflow, /jobs:\n\s+quality:/);
  assert.match(workflow, /jobs:\n[\s\S]*mutation:/);
  assert.match(workflow, /fail-fast: false/);
  for (const suite of [
    "source-about-client",
    "source-about-map",
    "source-career",
    "source-blog",
    "source-core",
    "routes",
    "og",
    "content",
  ]) {
    assert.match(workflow, new RegExp(`- ${suite}`));
  }
  assert.doesNotMatch(workflow, /\n\s+- source\s*$/m);
  assert.match(workflow, /run: npm run test:mutation:\$\{\{ matrix\.suite \}\}/);
});

test("Biome check shares the quality job instead of a duplicate workflow", () => {
  assert.equal(existsSync(new URL("../.github/workflows/lint.yml", import.meta.url)), false);
  assert.match(
    workflow,
    /quality:[\s\S]*?run: npm run check && npm run test:coverage && npm run test:crap:report/
  );
});
