import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("the disconnected archived welcome post stays removed", () => {
  assert.equal(
    existsSync(new URL("../src/archive/blog/welcome.md", import.meta.url)),
    false,
    "src/archive/blog/welcome.md is outside the active content collection"
  );
});
