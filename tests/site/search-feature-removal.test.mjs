import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { readRepoFile, repoUrl } from "../helpers/repo-files.mjs";

test("the removed search feature stays absent", () => {
  for (const path of [
    "src/pages/search.astro",
    "src/features/search/client/search.js",
    "src/assets/icons/IconSearch.svg",
  ]) {
    assert.equal(existsSync(repoUrl(path)), false, `${path} should stay removed`);
  }

  const packageJson = JSON.parse(readRepoFile("package.json"));
  const packageLock = JSON.parse(readRepoFile("package-lock.json"));

  for (const dependency of ["@pagefind/default-ui", "fuse.js", "pagefind"]) {
    assert.equal(packageJson.dependencies[dependency], undefined);
    assert.equal(packageLock.packages[`node_modules/${dependency}`], undefined);
  }

  const featureReferences = [
    readRepoFile("astro.config.mjs"),
    readRepoFile("CHANGELOG.md"),
    readRepoFile("src/components/Header.astro"),
    readRepoFile("src/layouts/PostDetails.astro"),
    readRepoFile("src/types.d.ts"),
    readRepoFile("src/utils/structuredData.ts"),
  ].join("\n");
  const buildScripts = `${packageJson.scripts.build}\n${packageJson.scripts["build:check"]}`;

  assert.doesNotMatch(featureReferences, /pagefind|IconSearch|SearchAction|["'`]\/search/i);
  assert.doesNotMatch(buildScripts, /pagefind/i);

  const redirect = readRepoFile("src/components/StaticRedirect.astro");
  const redirectCleanup = readRepoFile("src/utils/removeStylesheetLinksFromStaticRedirect.mjs");

  assert.match(redirect, /data-static-redirect/);
  assert.match(redirectCleanup, /data-static-redirect/);
  assert.doesNotMatch(`${redirect}\n${redirectCleanup}`, /pagefind/i);
});
