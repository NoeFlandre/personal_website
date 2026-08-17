import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const rootUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(rootUrl(path), "utf8");

async function loadPostFilterOptions() {
  try {
    return (await import("../src/features/blog/utils/getPostFilterOptions.ts"))
      .getPostFilterOptions;
  } catch {
    assert.fail("getPostFilterOptions should exist");
  }
}

test("post filter options mark All Posts active and link tags", async () => {
  const getPostFilterOptions = await loadPostFilterOptions();

  const tags = [
    { tag: "paper-review", tagName: "Paper Review" },
    { tag: "post", tagName: "Post" },
  ];

  assert.deepEqual(getPostFilterOptions(tags), [
    { label: "All Posts", href: "#main-content", active: true },
    { label: "Paper Review", href: "/tags/paper-review", active: false },
    { label: "Post", href: "/tags/post", active: false },
  ]);
});

test("the active tag toggles back to All Posts", async () => {
  const getPostFilterOptions = await loadPostFilterOptions();
  const tags = [
    { tag: "paper-review", tagName: "Paper Review" },
    { tag: "post", tagName: "Post" },
  ];

  assert.deepEqual(getPostFilterOptions(tags, "post"), [
    { label: "All Posts", href: "/posts", active: false },
    { label: "Paper Review", href: "/tags/paper-review", active: false },
    { label: "Post", href: "/posts", active: true },
  ]);
});

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
