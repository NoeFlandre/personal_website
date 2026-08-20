import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const biomeConfig = JSON.parse(readFileSync(new URL("../biome.json", import.meta.url), "utf8"));
const qualityPaths =
  "astro.config.mjs playwright.config.mjs public/toggle-theme.js scripts src tests";

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
  assert.equal(
    packageJson.scripts["test:mutation"],
    "stryker run && stryker run stryker.routes.config.json && stryker run stryker.og.config.json && stryker run stryker.content.config.json"
  );
  assert.match(packageJson.scripts["test:quality"], /npm run test/);
  assert.match(packageJson.scripts["test:quality"], /npm run test:crap/);
  assert.match(packageJson.scripts["test:quality"], /npm run test:mutation/);
});

test("mutation testing covers the source tree with behavioral tests", () => {
  const configPath = new URL("../stryker.config.json", import.meta.url);

  assert.equal(existsSync(configPath), true, "stryker.config.json should exist");

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.testRunner, "command");
  assert.equal(config.coverageAnalysis, "off");
  assert.deepEqual(config.mutate, [
    "src/**/*.js",
    "src/**/*.ts",
    "!src/content.config.ts",
    "!src/pages/**/*.ts",
    "!src/features/blog/og/**/*.js",
    "!src/features/blog/og/**/*.ts",
    "!src/utils/loadGoogleFont.ts",
  ]);
  assert.match(config.commandRunner.command, /node --test/);
  assert.match(config.commandRunner.command, /tests\/mutation-suite\.test\.mjs/);
  assert.deepEqual(config.reporters, ["clear-text", "progress"]);
  assert.deepEqual(config.thresholds, { high: 100, low: 100, break: 100 });

  const dedicatedConfigs = [
    ["stryker.routes.config.json", "src/pages/**/*.ts", "tests/mutation-route-suite.test.mjs"],
    [
      "stryker.og.config.json",
      [
        "src/features/blog/og/**/*.js",
        "src/features/blog/og/**/*.ts",
        "src/utils/loadGoogleFont.ts",
      ],
      "tests/mutation-og-suite.test.mjs",
    ],
    [
      "stryker.content.config.json",
      "src/content.config.ts",
      "tests/mutation-content-suite.test.mjs",
    ],
  ];

  for (const [fileName, mutate, testFile] of dedicatedConfigs) {
    const dedicatedPath = new URL(`../${fileName}`, import.meta.url);
    assert.equal(existsSync(dedicatedPath), true, `${fileName} should exist`);
    const dedicatedConfig = JSON.parse(readFileSync(dedicatedPath, "utf8"));
    assert.deepEqual(dedicatedConfig.mutate, Array.isArray(mutate) ? mutate : [mutate]);
    assert.match(
      dedicatedConfig.commandRunner.command,
      new RegExp(testFile.replaceAll(".", "\\."))
    );
    assert.deepEqual(dedicatedConfig.reporters, ["clear-text", "progress"]);
    assert.deepEqual(dedicatedConfig.thresholds, { high: 100, low: 100, break: 100 });
  }
});

test("coverage configuration reports the complete source tree", () => {
  const configPath = new URL("../.c8rc.json", import.meta.url);

  assert.equal(existsSync(configPath), true, ".c8rc.json should exist");

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.all, true);
  assert.deepEqual(config.src, ["src"]);
  assert.deepEqual(config.include, ["src/**/*.js", "src/**/*.ts"]);
  assert.deepEqual(config.exclude, ["src/**/*.d.ts"]);
  assert.deepEqual(config.extension, [".js", ".ts"]);
  assert.deepEqual(config.reporter, ["text", "html", "json"]);
  assert.equal(config["reports-dir"], "coverage/c8");
  assert.equal(config["check-coverage"], false);
});
