import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const biomeConfig = JSON.parse(readFileSync(new URL("../biome.json", import.meta.url), "utf8"));
const qualityPaths = "astro.config.mjs public/toggle-theme.js src tests";

test("quality scripts cover the root config, public browser script, source, and tests", () => {
  assert.equal(packageJson.scripts.check, `biome check ${qualityPaths}`);
  assert.equal(packageJson.scripts["check:fix"], `biome check --write ${qualityPaths}`);
  assert.equal(packageJson.scripts.lint, `biome lint ${qualityPaths}`);
  assert.equal(packageJson.scripts["lint:fix"], `biome lint --write ${qualityPaths}`);
  assert.equal(packageJson.scripts.format, `biome format --write ${qualityPaths}`);
});

test("Biome schema matches the configured CLI version", () => {
  const biomeVersion = packageJson.devDependencies["@biomejs/biome"].replace(/^[^\d]*/, "");

  assert.equal(biomeConfig.$schema, `https://biomejs.dev/schemas/${biomeVersion}/schema.json`);
});

test("lint-staged includes mjs files", () => {
  assert.deepEqual(packageJson["lint-staged"]["*.{js,mjs,ts,tsx,json}"], [
    "biome check --write --files-ignore-unknown=true",
  ]);
  assert.equal(packageJson["lint-staged"]["*.{js,ts,tsx,json}"], undefined);
});
