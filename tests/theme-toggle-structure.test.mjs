import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("ThemeToggle does not await a synchronous view transition call", () => {
  const source = readFileSync(
    new URL("../src/components/ThemeToggle.astro", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /await\s+document\.startViewTransition\(/);
  assert.match(source, /document\.startViewTransition\(\(\) => \{/);
});
