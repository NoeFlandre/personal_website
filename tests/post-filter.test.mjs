import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const rootUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(rootUrl(path), "utf8");

test("both pages use one accessible shared filter bar", () => {
  const componentPath = rootUrl("src/features/blog/components/PostFilterBar.astro");
  assert.equal(existsSync(componentPath), true, "PostFilterBar.astro should exist");

  const component = read("src/features/blog/components/PostFilterBar.astro");
  const postsPage = read("src/pages/posts/index.astro");
  const tagPage = read("src/pages/tags/[tag]/[...page].astro");

  assert.match(component, /aria-label="Post filters"/);
  assert.match(component, /aria-current/);
  assert.match(component, /getPostFilterOptions/);
  assert.match(postsPage, /<PostFilterBar\s+tags=\{[^}]+\}/);
  assert.match(tagPage, /<PostFilterBar\s+tags=\{[^}]+\}\s+activeTag=\{tag\}/);
});
