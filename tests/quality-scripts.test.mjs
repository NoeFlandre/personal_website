import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const biomeConfig = JSON.parse(readFileSync(new URL("../biome.json", import.meta.url), "utf8"));
const qualityPaths = "astro.config.mjs public/toggle-theme.js scripts src tests";

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

test("quality scripts expose coverage, CRAP, and mutation checks", () => {
  assert.match(packageJson.scripts["test:coverage"], /^c8 /);
  assert.match(packageJson.scripts["test:coverage"], /node --test tests\/\*\*\/\*\.test\.mjs/);
  assert.match(packageJson.scripts["test:crap"], /npm run test:coverage/);
  assert.match(packageJson.scripts["test:crap"], /crap coverage\/c8\/coverage-final\.json/);
  assert.match(packageJson.scripts["test:crap"], /--json crap-report\/crap-report\.json/);
  assert.match(packageJson.scripts["test:crap"], /--html crap-report\/html/);
  assert.match(
    packageJson.scripts["test:crap"],
    /check-crap-score\.mjs crap-report\/crap-report\.json 6/
  );
  assert.equal(packageJson.scripts["test:mutation"], "stryker run");
  assert.match(packageJson.scripts["test:quality"], /npm run test/);
  assert.match(packageJson.scripts["test:quality"], /npm run test:crap/);
  assert.match(packageJson.scripts["test:quality"], /npm run test:mutation/);
});

test("mutation testing is scoped to pure utilities with a real test command", () => {
  const configPath = new URL("../stryker.config.json", import.meta.url);

  assert.equal(existsSync(configPath), true, "stryker.config.json should exist");

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.testRunner, "command");
  assert.equal(config.coverageAnalysis, "off");
  assert.deepEqual(config.mutate, [
    "src/features/about/utils/aboutMap.js",
    "src/features/blog/utils/getAdjacentEntries.js",
  ]);
  assert.match(config.commandRunner.command, /node --test/);
  assert.match(config.commandRunner.command, /about-map-regression\.test\.mjs/);
  assert.match(config.commandRunner.command, /adjacent-posts\.test\.mjs/);
  assert.deepEqual(config.thresholds, { high: 100, low: 100, break: 100 });
});

test("coverage configuration reports the utilities that have focused tests", () => {
  const configPath = new URL("../.c8rc.json", import.meta.url);

  assert.equal(existsSync(configPath), true, ".c8rc.json should exist");

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.all, true);
  assert.deepEqual(config.src, ["src/features/about/utils", "src/features/blog/utils"]);
  assert.deepEqual(config.include, [
    "src/features/about/utils/**/*.js",
    "src/features/blog/utils/**/*.js",
    "src/features/blog/utils/**/*.ts",
  ]);
  assert.deepEqual(config.exclude, ["src/features/blog/utils/readingTime.ts"]);
  assert.deepEqual(config.extension, [".js", ".ts"]);
  assert.deepEqual(config.reporter, ["text", "html", "json"]);
  assert.equal(config["reports-dir"], "coverage/c8");
  assert.equal(config["check-coverage"], true);
  assert.equal(config.branches, 97);
  assert.equal(config.lines, 100);
  assert.equal(config.statements, 100);
  assert.equal(config.functions, 100);
});
