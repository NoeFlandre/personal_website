import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("quality scripts cover source and test files", () => {
  assert.equal(packageJson.scripts.check, "biome check src tests");
  assert.equal(packageJson.scripts["check:fix"], "biome check --write src tests");
  assert.equal(packageJson.scripts.lint, "biome lint src tests");
  assert.equal(packageJson.scripts["lint:fix"], "biome lint --write src tests");
  assert.equal(packageJson.scripts.format, "biome format --write src tests");
});

test("lint-staged includes mjs files", () => {
  assert.deepEqual(packageJson["lint-staged"]["*.{js,mjs,ts,tsx,json}"], [
    "biome check --write --files-ignore-unknown=true",
  ]);
  assert.equal(packageJson["lint-staged"]["*.{js,ts,tsx,json}"], undefined);
});
