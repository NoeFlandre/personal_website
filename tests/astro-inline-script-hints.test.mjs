import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("scripts that Astro already treats as inline declare is:inline explicitly", () => {
  const structuredData = read("src/components/StructuredData.astro");
  const layout = read("src/layouts/Layout.astro");
  const postDetails = read("src/layouts/PostDetails.astro");
  const themeToggle = read("src/components/ThemeToggle.astro");

  assert.match(
    structuredData,
    /<script[\s\S]*is:inline[\s\S]*type="application\/ld\+json"[\s\S]*set:html=\{serializeStructuredData\(structuredData\)\}[\s\S]*\/>/
  );
  assert.doesNotMatch(layout, /application\/ld\+json/);
  assert.match(
    layout,
    /<script\s+is:inline\s+async\s+src="https:\/\/platform\.twitter\.com\/widgets\.js"\s+charset="utf-8"><\/script>/
  );
  assert.doesNotMatch(layout, /ViewTransitions/);
  assert.match(layout, /ClientRouter/);
  assert.match(
    postDetails,
    /<script\s+is:inline\s+type="module"\s+data-astro-rerun\s+define:vars=\{\{\s*postDetailsRerunUrl\s*\}\}>[\s\S]*import\(postDetailsRerunUrl\)\.then\(\(\{\s*initPostDetails\s*\}\)\s*=>\s*initPostDetails\(\)\);[\s\S]*<\/script>/
  );
  assert.doesNotMatch(themeToggle, /await\s+document\.startViewTransition\(/);
});
