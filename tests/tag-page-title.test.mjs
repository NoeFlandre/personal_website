import assert from "node:assert/strict";
import test from "node:test";
import { readRepoFile } from "./helpers/repo-files.mjs";

test('tag page has no slot="title" node that Main discards', () => {
  const tagPage = readRepoFile("src/pages/tags/[tag]/[...page].astro");

  assert.doesNotMatch(tagPage, /slot="title"/);
});

test("tag page heading comes from Main props with the tag transition name", () => {
  const tagPage = readRepoFile("src/pages/tags/[tag]/[...page].astro");

  assert.match(tagPage, /pageTitle=\{\[`Tag:`, `\$\{tagName\}`\]\}/);
  assert.match(tagPage, /titleTransition=\{tag\}/);
});
