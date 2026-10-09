import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(fromRoot(path), "utf8");

test("every class selector in the About layout style block is used by its markup", () => {
  const layout = read("src/layouts/AboutLayout.astro");
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
  const css = read("src/styles/global.css");

  assert.equal(css.match(/view-transition-name:\s*root;/g)?.length, 1);
});

test("global.css has no animation-duration that the fade shorthand overrides", () => {
  assert.doesNotMatch(read("src/styles/global.css"), /animation-duration/);
});
