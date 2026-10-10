import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/astro-build.yml", import.meta.url),
  "utf8"
);
const npmrc = readFileSync(new URL("../.npmrc", import.meta.url), "utf8");
const runCommands = [...workflow.matchAll(/^\s*run:\s*(.+)$/gm)].map((match) => match[1].trim());
// Body of a key indented two spaces (a trigger under `on:` or a job under `jobs:`).
const blockAt = (key) =>
  workflow.match(new RegExp(`^  ${key}:\\n((?:    .*(?:\\n|$)|\\n)*)`, "m"))?.[1] ?? "";

function meetsNodeMinimum(text) {
  const [, major, minor] = text.match(/^\s+NODE_VERSION: "(\d+)(?:\.(\d+))?"$/m) ?? [];
  const nodeMajor = Number(major);

  if (nodeMajor !== 22) {
    return nodeMajor > 22;
  }
  // A bare "22" pin resolves to the newest 22.x release, which is past 22.18.
  return minor === undefined || Number(minor) >= 18;
}

test("CI uses a Node release line with native TypeScript test support", () => {
  assert.ok(
    meetsNodeMinimum(workflow),
    "Direct TypeScript test imports require Node 22.18 or newer"
  );
});

test("Node minimum accepts minor pins and enforces the 22.18 floor", () => {
  const pin = (version) => `  NODE_VERSION: "${version}"`;

  assert.equal(meetsNodeMinimum(pin("22.18")), true);
  assert.equal(meetsNodeMinimum(pin("22.17")), false);
  assert.equal(meetsNodeMinimum(pin("21.9")), false);
  assert.equal(meetsNodeMinimum(pin("24")), true);
});

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

test("CI reports production dependency advisories without failing on the current backlog", () => {
  assert.match(
    workflow,
    /- name: Audit production dependencies\n\s+run: npm audit --omit=dev\n\s+continue-on-error: true/
  );
});

test("npm audit is not disabled in .npmrc", () => {
  assert.doesNotMatch(npmrc, /^\s*audit\s*=\s*false\s*$/m);
});

test("pull_request runs on every pull request, not only those targeting main", () => {
  assert.match(workflow, /^ {2}pull_request:$/m);
  assert.doesNotMatch(blockAt("pull_request"), /branches/);
});

test("push runs only on main, which the mutation gate relies on", () => {
  assert.match(blockAt("push"), /^ {4}branches: \[main\]$/m);
});

test("fast jobs have no job-level if, so they run on every pull request", () => {
  for (const job of ["quality", "build", "e2e"]) {
    assert.doesNotMatch(blockAt(job), /^ {4}if:/m, `${job} must not be gated`);
  }
});

test("mutation runs only for pushes or for pull requests into main", () => {
  assert.match(
    blockAt("mutation"),
    /^ {4}if: github\.event_name == 'push' \|\| github\.base_ref == 'main'$/m
  );
});

test("workflow token defaults to read-only contents", () => {
  assert.match(workflow, /^permissions:\n {2}contents: read$/m);
});
