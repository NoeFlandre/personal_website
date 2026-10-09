import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test, { before } from "node:test";

const repoRoot = new URL("..", import.meta.url);

function runTypecheck() {
  execFileSync("npx", ["tsc", "--noEmit", "--project", "tests/typechecks/tsconfig.json"], {
    cwd: repoRoot,
    stdio: "pipe",
  });
}

before(() => {
  execFileSync("npx", ["astro", "sync"], { cwd: repoRoot, stdio: "pipe" });
});

test("buildPostLayoutMetadata accepts nullable modDatetime from content entries", () => {
  assert.doesNotThrow(runTypecheck);
});

test("JS helpers used by TypeScript declare typed parameters", () => {
  assert.doesNotThrow(runTypecheck);
});
