import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("blog tag presentation uses the shared filter route helper", () => {
  const tagComponent = readFileSync(
    new URL("../src/components/Tag.astro", import.meta.url),
    "utf8"
  );

  assert.match(tagComponent, /getTagPath/);
});
