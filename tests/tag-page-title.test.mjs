import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test('tag page has no slot="title" node that Main discards', () => {
  const tagPage = read("src/pages/tags/[tag]/[...page].astro");

  assert.doesNotMatch(tagPage, /slot="title"/);
});

test("tag page heading comes from Main props with the tag transition name", () => {
  const tagPage = read("src/pages/tags/[tag]/[...page].astro");

  assert.match(tagPage, /pageTitle=\{\[`Tag:`, `\$\{tagName\}`\]\}/);
  assert.match(tagPage, /titleTransition=\{tag\}/);
});
