import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/astro-build.yml", import.meta.url),
  "utf8"
);
const runCommands = [...workflow.matchAll(/^\s*run:\s*(.+)$/gm)].map((match) => match[1].trim());

test("Astro CI runs the checked build through the browser smoke command", () => {
  assert.equal(runCommands.includes("npm run test:e2e"), true);
  assert.equal(runCommands.includes("npm run build:check"), false);
  assert.equal(runCommands.includes("npm run astro -- check"), false);
  assert.equal(runCommands.includes("npm run build"), false);
});

test("Astro CI runs the complete quality gate", () => {
  assert.equal(runCommands.includes("npm run test:quality"), true);
});
