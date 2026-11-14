import assert from "node:assert/strict";
import test from "node:test";
import { readRepoFile } from "./helpers/repo-files.mjs";

test("scripts that Astro already treats as inline declare is:inline explicitly", () => {
  const structuredData = readRepoFile("src/components/StructuredData.astro");
  const layout = readRepoFile("src/layouts/Layout.astro");

  assert.match(
    structuredData,
    /<script[\s\S]*is:inline[\s\S]*type="application\/ld\+json"[\s\S]*set:html=\{serializeStructuredData\(structuredData\)\}[\s\S]*\/>/
  );
  assert.doesNotMatch(layout, /application\/ld\+json/);
  assert.doesNotMatch(layout, /ViewTransitions/);
  assert.match(layout, /ClientRouter/);
});
