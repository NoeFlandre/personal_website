import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { readRepoFile, repoUrl } from "../helpers/repo-files.mjs";

test("the unused critical CSS module stays removed", () => {
  for (const path of ["src/utils/criticalCSS.ts", "tests/critical-css.test.mjs"]) {
    assert.equal(existsSync(repoUrl(path)), false, `${path} should stay removed`);
  }

  for (const path of [
    "config/stryker/source-about-client.json",
    "config/stryker/source-about-map.json",
    "config/stryker/source-blog.json",
    "config/stryker/source-career.json",
    "config/stryker/source-core.json",
  ]) {
    assert.doesNotMatch(
      readRepoFile(path),
      /critical-css/,
      `${path} should not run the removed test`
    );
  }

  assert.doesNotMatch(readRepoFile("CHANGELOG.md"), /critical css/i);
});
