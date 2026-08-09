import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const biomeConfig = JSON.parse(readFileSync(new URL("../biome.json", import.meta.url), "utf8"));

test("quality scripts cover the root Astro config, source, and tests", () => {
  assert.equal(packageJson.scripts.check, "biome check astro.config.mjs src tests");
  assert.equal(packageJson.scripts["check:fix"], "biome check --write astro.config.mjs src tests");
  assert.equal(packageJson.scripts.lint, "biome lint astro.config.mjs src tests");
  assert.equal(packageJson.scripts["lint:fix"], "biome lint --write astro.config.mjs src tests");
  assert.equal(packageJson.scripts.format, "biome format --write astro.config.mjs src tests");
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
