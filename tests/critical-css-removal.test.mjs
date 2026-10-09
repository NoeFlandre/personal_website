import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(fromRoot(path), "utf8");

test("the unused critical CSS module stays removed", () => {
  for (const path of ["src/utils/criticalCSS.ts", "tests/critical-css.test.mjs"]) {
    assert.equal(existsSync(fromRoot(path)), false, `${path} should stay removed`);
  }

  for (const path of [
    "stryker.config.json",
    "stryker.source-about-map.config.json",
    "stryker.source-blog.config.json",
    "stryker.source-career.config.json",
    "stryker.source-core.config.json",
  ]) {
    assert.doesNotMatch(read(path), /critical-css/, `${path} should not run the removed test`);
  }

  assert.doesNotMatch(read("CHANGELOG.md"), /critical css/i);
});
