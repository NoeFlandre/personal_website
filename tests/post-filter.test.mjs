import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { readRepoFile, repoUrl } from "./helpers/repo-files.mjs";

test("both pages use one accessible shared filter bar", () => {
  const componentPath = repoUrl("src/features/blog/components/PostFilterBar.astro");
  assert.equal(existsSync(componentPath), true, "PostFilterBar.astro should exist");

  const component = readRepoFile("src/features/blog/components/PostFilterBar.astro");
  const postsPage = readRepoFile("src/pages/posts/index.astro");
  const tagPage = readRepoFile("src/pages/tags/[tag]/[...page].astro");

  assert.match(component, /aria-label="Post filters"/);
  assert.match(component, /aria-current/);
  assert.match(component, /getPostFilterOptions/);
  assert.match(postsPage, /<PostFilterBar\s+tags=\{[^}]+\}/);
  assert.match(tagPage, /<PostFilterBar\s+tags=\{[^}]+\}\s+activeTag=\{tag\}/);
});
