import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readRepoFile, repoUrl } from "../helpers/repo-files.mjs";

test("every class selector in the About layout style block is used by its markup", () => {
  const layout = readRepoFile("src/layouts/AboutLayout.astro");
  const style = layout.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const markupClasses = new Set(
    [...layout.matchAll(/class="([^"]+)"/g)].flatMap(([, value]) => value.split(/\s+/))
  );
  const unusedSelectors = [...style.matchAll(/\.([a-zA-Z_][\w-]*)/g)]
    .map(([, name]) => name)
    .filter((name) => !markupClasses.has(name));

  assert.deepEqual([...new Set(unusedSelectors)], []);
});

test("global.css declares the root view transition name once", () => {
  const css = readRepoFile("src/styles/global.css");

  assert.equal(css.match(/view-transition-name:\s*root;/g)?.length, 1);
});

test("global.css has no animation-duration that the fade shorthand overrides", () => {
  assert.doesNotMatch(readRepoFile("src/styles/global.css"), /animation-duration/);
});

test("light-mode comment color selectors never match when data-theme is dark", () => {
  const css = readRepoFile("src/styles/typography.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const [, selectors = ""] = css.match(/([^{};]*)\{\s*color:\s*#495057 !important;/) ?? [];
  const lightOnly = /^(html\[data-theme="light"\]|:root:not\(\[data-theme="dark"\]\))\s/;
  const unscoped = selectors
    .split(",")
    .map((selector) => selector.trim())
    .filter((selector) => !lightOnly.test(selector));

  assert.ok(selectors.trim().length > 0, "light-mode comment color rule not found");
  assert.deepEqual(unscoped, []);
});
