import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("buildPostLayoutMetadata accepts nullable modDatetime from content entries", () => {
  assert.doesNotThrow(() => {
    execFileSync("npx", ["tsc", "--noEmit", "--project", "tests/typechecks/tsconfig.json"], {
      cwd: new URL("..", import.meta.url),
      stdio: "pipe",
    });
  });
});
