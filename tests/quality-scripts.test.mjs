import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const biomeConfig = JSON.parse(readFileSync(new URL("../biome.json", import.meta.url), "utf8"));
const qualityPaths =
  "astro.config.mjs playwright.config.mjs public/toggle-theme.js scripts src tests";
const regularTestGlob = "tests/**/*.test.mjs";

function readWorkspaceFile(fileName) {
  return readFileSync(new URL(`../${fileName}`, import.meta.url), "utf8");
}

function globToRegExp(glob) {
  let pattern = "";
  for (let index = 0; index < glob.length; index += 1) {
    if (glob.startsWith("**/", index)) {
      pattern += "(?:.*/)?";
      index += 2;
    } else if (glob[index] === "*") {
      pattern += "[^/]*";
    } else {
      pattern += glob[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${pattern}$`);
}

function matchesAnyPattern(fileName, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(fileName));
}

const mutationIgnorePatterns = [
  ".astro/**",
  ".stryker-tmp/**",
  "coverage/**",
  "crap-report/**",
  "dist/**",
  "output/**",
  "public/assets/**",
  "public/generated/**",
  "public/textual-descriptions-place-on-earth/**",
  "reports/**",
];

const sourceMutationPartitions = [
  {
    configFile: "stryker.source-about-client.config.json",
    scriptName: "source-about-client",
    mutate: ["src/features/about/client/**/*.js", "src/features/about/utils/**/*.js"],
  },
  {
    configFile: "stryker.source-about-map.config.json",
    scriptName: "source-about-map",
    mutate: ["src/features/about/data/aboutMapPlaces.ts"],
  },
  {
    configFile: "stryker.source-career.config.json",
    scriptName: "source-career",
    mutate: ["src/features/about/data/careerTimelineData.ts", "src/features/about/data/links.ts"],
  },
  {
    configFile: "stryker.source-blog.config.json",
    scriptName: "source-blog",
    mutate: [
      "src/features/blog/client/**/*.js",
      "src/features/blog/contentPaths.ts",
      "src/features/blog/contentRules.ts",
      "src/features/blog/utils/**/*.js",
      "src/features/blog/utils/**/*.ts",
    ],
  },
  {
    configFile: "stryker.source-core.config.json",
    scriptName: "source-core",
    mutate: [
      "src/env.d.ts",
      "src/types.d.ts",
      "src/site-config.js",
      "src/utils/**/*.js",
      "src/utils/**/*.ts",
      "src/utils/**/*.mjs",
      "!src/utils/loadOgFonts.ts",
    ],
  },
];

const originalSourceMutationPatterns = ["src/**/*.js", "src/**/*.ts", "src/**/*.mjs"];
const originalSourceMutationExclusions = [
  "src/content.config.ts",
  "src/pages/**/*.ts",
  "src/features/blog/og/**/*.js",
  "src/features/blog/og/**/*.ts",
  "src/utils/loadOgFonts.ts",
];

function trackedSourceFiles() {
  return execFileSync("git", ["ls-files", "-z", "src"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    encoding: "utf8",
  })
    .split("\0")
    .filter((fileName) => /\.(?:js|ts|mjs)$/.test(fileName));
}

test("quality scripts cover the root config, public browser script, source, and tests", () => {
  assert.equal(packageJson.scripts.check, `biome check ${qualityPaths}`);
  assert.equal(packageJson.scripts["check:fix"], `biome check --write ${qualityPaths}`);
  assert.equal(packageJson.scripts.lint, `biome lint ${qualityPaths}`);
  assert.equal(packageJson.scripts["lint:fix"], `biome lint --write ${qualityPaths}`);
  assert.equal(packageJson.scripts.format, `biome format --write ${qualityPaths}`);
});

test("Biome scope excludes only generated public assets", () => {
  const publicExclusions = biomeConfig.files.includes.filter(
    (pattern) => pattern.startsWith("!") && pattern.includes("public")
  );

  assert.deepEqual(publicExclusions, ["!**/public/generated"]);
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
  assert.match(
    packageJson.scripts["test:coverage"],
    /node --test(?: --test-concurrency=\d+)? "tests\/\*\*\/\*\.test\.mjs"/
  );
  assert.equal(
    packageJson.scripts["test:crap"],
    "npm run test:coverage && npm run test:crap:report"
  );
  assert.match(packageJson.scripts["test:crap:report"], /crap coverage\/c8\/coverage-final\.json/);
  assert.match(packageJson.scripts["test:crap:report"], /--json crap-report\/crap-report\.json/);
  assert.match(packageJson.scripts["test:crap:report"], /--html crap-report\/html/);
  assert.match(
    packageJson.scripts["test:crap:report"],
    /check-crap-score\.mjs crap-report\/crap-report\.json 6/
  );
  assert.equal(
    packageJson.scripts["test:mutation:source"],
    sourceMutationPartitions
      .map(({ scriptName }) => `npm run test:mutation:${scriptName}`)
      .join(" && ")
  );
  assert.equal(
    packageJson.scripts["test:mutation:source-about-client"],
    "stryker run stryker.source-about-client.config.json"
  );
  assert.equal(
    packageJson.scripts["test:mutation:source-about-map"],
    "stryker run stryker.source-about-map.config.json"
  );
  assert.equal(
    packageJson.scripts["test:mutation:source-career"],
    "stryker run stryker.source-career.config.json"
  );
  assert.equal(
    packageJson.scripts["test:mutation:source-blog"],
    "stryker run stryker.source-blog.config.json"
  );
  assert.equal(
    packageJson.scripts["test:mutation:source-core"],
    "stryker run stryker.source-core.config.json"
  );
  assert.equal(
    packageJson.scripts["test:mutation:routes"],
    "stryker run stryker.routes.config.json"
  );
  assert.equal(packageJson.scripts["test:mutation:og"], "stryker run stryker.og.config.json");
  assert.equal(
    packageJson.scripts["test:mutation:content"],
    "stryker run stryker.content.config.json"
  );
  assert.equal(
    packageJson.scripts["test:mutation"],
    "npm run test:mutation:source && npm run test:mutation:routes && npm run test:mutation:og && npm run test:mutation:content"
  );
  assert.equal(
    packageJson.scripts["test:quality"],
    "npm run test:coverage && npm run test:crap:report && npm run test:mutation"
  );
  assert.doesNotMatch(packageJson.scripts["test:quality"], /npm run test &&/);
});

test("regular test scripts use bounded file-level concurrency", () => {
  assert.equal(packageJson.scripts.test, `node --test --test-concurrency=4 "${regularTestGlob}"`);
  assert.equal(
    packageJson.scripts["test:coverage"],
    `c8 node --test --test-concurrency=4 "${regularTestGlob}"`
  );
});

test("regular test glob discovers at least one test file", () => {
  const discovered = globSync(regularTestGlob, {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
  });

  assert.notEqual(discovered.length, 0);
});

test("mutation testing covers the source tree with behavioral tests", () => {
  const sharedConfig = JSON.parse(readWorkspaceFile("stryker.source-about-client.config.json"));

  for (const partition of sourceMutationPartitions) {
    const configPath = new URL(`../${partition.configFile}`, import.meta.url);

    assert.equal(existsSync(configPath), true, `${partition.configFile} should exist`);

    const config = JSON.parse(readFileSync(configPath, "utf8"));
    assert.equal(config.testRunner, "command");
    assert.equal(config.coverageAnalysis, "off");
    assert.equal(config.cleanTempDir, "always");
    assert.deepEqual(config.ignorePatterns, mutationIgnorePatterns);
    assert.deepEqual(config.mutate, partition.mutate);
    assert.match(config.commandRunner.command, /node --test --test-concurrency=1/);
    assert.match(config.commandRunner.command, /tests\/about-map-controller\.test\.mjs/);
    assert.equal(
      config.commandRunner.command,
      sharedConfig.commandRunner.command,
      `${partition.configFile} should run the shared Stryker test list`
    );
    assert.equal(config.concurrency, 4);
    assert.deepEqual(config.reporters, ["clear-text", "progress"]);
    assert.deepEqual(config.thresholds, { high: 100, low: 100, break: 100 });
  }

  const aboutClientConfig = JSON.parse(
    readWorkspaceFile("stryker.source-about-client.config.json")
  );
  assert.match(
    aboutClientConfig.commandRunner.command,
    /tests\/testimonials-carousel-client\.test\.mjs/
  );

  const dedicatedConfigs = [
    ["stryker.routes.config.json", "src/pages/**/*.ts", "tests/route-api.test.mjs"],
    [
      "stryker.og.config.json",
      ["src/features/blog/og/**/*.js", "src/features/blog/og/**/*.ts", "src/utils/loadOgFonts.ts"],
      "tests/og-images.test.mjs",
    ],
    ["stryker.content.config.json", "src/content.config.ts", "tests/content-config.test.mjs"],
  ];

  for (const [fileName, mutate, testFile] of dedicatedConfigs) {
    const dedicatedPath = new URL(`../${fileName}`, import.meta.url);
    assert.equal(existsSync(dedicatedPath), true, `${fileName} should exist`);
    const dedicatedConfig = JSON.parse(readFileSync(dedicatedPath, "utf8"));
    assert.deepEqual(dedicatedConfig.ignorePatterns, mutationIgnorePatterns);
    assert.equal(dedicatedConfig.cleanTempDir, "always");
    assert.deepEqual(dedicatedConfig.mutate, Array.isArray(mutate) ? mutate : [mutate]);
    assert.match(dedicatedConfig.commandRunner.command, /node --test --test-concurrency=4/);
    assert.match(
      dedicatedConfig.commandRunner.command,
      new RegExp(testFile.replaceAll(".", "\\."))
    );
    assert.equal(dedicatedConfig.concurrency, 4);
    assert.deepEqual(dedicatedConfig.reporters, ["clear-text", "progress"]);
    assert.deepEqual(dedicatedConfig.thresholds, { high: 100, low: 100, break: 100 });
  }
});

// These files mix behavioral tests with source-text checks. docs/TESTING.md keeps
// source-inspection tests out of Stryker runs, so they stay unlisted until they are split.
const sourceInspectionTests = [
  "tests/about-links.test.mjs",
  "tests/back-url-storage.test.mjs",
  "tests/gerard-dray-links.test.mjs",
  "tests/homepage-featured-posts.test.mjs",
  "tests/markdown-response.test.mjs",
];

test("every test importing a mutated module is listed in a Stryker command", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const strykerConfigs = globSync("stryker*.config.json", { cwd: root }).map((fileName) =>
    JSON.parse(readWorkspaceFile(fileName))
  );
  const listedTests = new Set(
    strykerConfigs.flatMap(({ commandRunner }) =>
      commandRunner.command.split(/\s+/).filter((token) => token.endsWith(".test.mjs"))
    )
  );
  const mutationScopes = strykerConfigs.map(({ mutate }) => ({
    include: mutate.filter((pattern) => !pattern.startsWith("!")),
    exclude: mutate.filter((pattern) => pattern.startsWith("!")).map((pattern) => pattern.slice(1)),
  }));
  const isMutated = (fileName) =>
    mutationScopes.some(
      ({ include, exclude }) =>
        matchesAnyPattern(fileName, include) && !matchesAnyPattern(fileName, exclude)
    );
  const importedFiles = (testFile) => {
    const source = readFileSync(new URL(`../${testFile}`, import.meta.url), "utf8");
    return [...source.matchAll(/\b(?:from\s+|import\(\s*)["'](\.{1,2}\/[^"']+)["']/g)].map(
      ([, specifier]) => relative(root, resolve(root, dirname(testFile), specifier))
    );
  };
  const unlisted = globSync(regularTestGlob, { cwd: root }).filter(
    (testFile) =>
      !listedTests.has(testFile) && importedFiles(testFile).some((fileName) => isMutated(fileName))
  );

  assert.deepEqual(
    unlisted.filter((testFile) => !sourceInspectionTests.includes(testFile)),
    [],
    "behavioral tests that import mutated modules must be listed in a Stryker command"
  );
  assert.deepEqual(
    sourceInspectionTests.filter((testFile) => !unlisted.includes(testFile)),
    [],
    "sourceInspectionTests entries must still be unlisted tests that import mutated modules"
  );
});

test("source mutation partitions are disjoint and preserve the original scope", () => {
  const sourceFiles = trackedSourceFiles();
  const originalScope = sourceFiles.filter(
    (fileName) =>
      matchesAnyPattern(fileName, originalSourceMutationPatterns) &&
      !matchesAnyPattern(fileName, originalSourceMutationExclusions)
  );
  const partitionedScope = new Map();

  for (const { configFile, mutate } of sourceMutationPartitions) {
    const positivePatterns = mutate.filter((pattern) => !pattern.startsWith("!"));
    const negativePatterns = mutate
      .filter((pattern) => pattern.startsWith("!"))
      .map((pattern) => pattern.slice(1));

    for (const fileName of sourceFiles) {
      if (
        matchesAnyPattern(fileName, positivePatterns) &&
        !matchesAnyPattern(fileName, negativePatterns)
      ) {
        const owners = partitionedScope.get(fileName) ?? [];
        owners.push(configFile);
        partitionedScope.set(fileName, owners);
      }
    }
  }

  assert.deepEqual([...partitionedScope.keys()].sort(), [...originalScope].sort());
  for (const [fileName, owners] of partitionedScope) {
    assert.equal(owners.length, 1, `${fileName} belongs to multiple mutation partitions`);
  }
});

test("coverage configuration reports the complete source tree", () => {
  const configPath = new URL("../.c8rc.json", import.meta.url);

  assert.equal(existsSync(configPath), true, ".c8rc.json should exist");

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.all, true);
  assert.deepEqual(config.src, ["src"]);
  assert.deepEqual(config.include, ["src/**/*.js", "src/**/*.ts", "src/**/*.mjs"]);
  assert.deepEqual(config.exclude, ["src/**/*.d.ts"]);
  assert.deepEqual(config.extension, [".js", ".ts", ".mjs"]);
  assert.deepEqual(config.reporter, ["text", "html", "json"]);
  assert.equal(config["reports-dir"], "coverage/c8");
  assert.equal(config["check-coverage"], true);
  assert.equal(config.branches, 94);
  assert.equal(config.lines, 99);
  assert.equal(config.statements, 99);
  assert.equal(config.functions, 91);
});
