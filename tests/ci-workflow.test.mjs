import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/astro-build.yml", import.meta.url),
  "utf8"
);
const runCommands = [...workflow.matchAll(/^\s*run:\s*(.+)$/gm)].map((match) => match[1].trim());

test("Astro CI reuses the canonical checked build command", () => {
  assert.deepEqual(
    runCommands.filter((command) => command === "npm run build:check"),
    ["npm run build:check"]
  );
  assert.equal(runCommands.includes("npm run astro -- check"), false);
  assert.equal(runCommands.includes("npm run build"), false);
});
