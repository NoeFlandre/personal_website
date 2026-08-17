import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(fromRoot(path), "utf8");

test("the removed search feature stays absent", () => {
  for (const path of [
    "src/pages/search.astro",
    "src/features/search/client/search.js",
    "src/assets/icons/IconSearch.svg",
  ]) {
    assert.equal(existsSync(fromRoot(path)), false, `${path} should stay removed`);
  }

  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));

  for (const dependency of ["@pagefind/default-ui", "fuse.js", "pagefind"]) {
    assert.equal(packageJson.dependencies[dependency], undefined);
    assert.equal(packageLock.packages[`node_modules/${dependency}`], undefined);
  }

  const featureReferences = [
    read("astro.config.mjs"),
    read("CHANGELOG.md"),
    read("src/components/Header.astro"),
    read("src/layouts/PostDetails.astro"),
    read("src/types.d.ts"),
    read("src/utils/structuredData.ts"),
  ].join("\n");
  const buildScripts = `${packageJson.scripts.build}\n${packageJson.scripts["build:check"]}`;

  assert.doesNotMatch(featureReferences, /pagefind|IconSearch|SearchAction|["'`]\/search/i);
  assert.doesNotMatch(buildScripts, /pagefind/i);

  const redirect = read("src/components/StaticRedirect.astro");
  const redirectCleanup = read("src/utils/removeStylesheetLinksFromStaticRedirect.mjs");

  assert.match(redirect, /data-static-redirect/);
  assert.match(redirectCleanup, /data-static-redirect/);
  assert.doesNotMatch(`${redirect}\n${redirectCleanup}`, /pagefind/i);
});
