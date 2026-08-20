import assert from "node:assert/strict";
import test from "node:test";
import { getPostFilterOptions } from "../src/features/blog/utils/getPostFilterOptions.ts";

const tags = [
  { tag: "research", tagName: "Research" },
  { tag: "open-source", tagName: "Open Source" },
];

test("post filter options expose the all-posts default state", () => {
  assert.deepEqual(getPostFilterOptions(tags), [
    { label: "All Posts", href: "#main-content", active: true },
    { label: "Research", href: "/tags/research", active: false },
    { label: "Open Source", href: "/tags/open-source", active: false },
  ]);
});

test("post filter options normalize the active tag and activate its option", () => {
  assert.deepEqual(getPostFilterOptions(tags, " research "), [
    { label: "All Posts", href: "/posts", active: false },
    { label: "Research", href: "/posts", active: true },
    { label: "Open Source", href: "/tags/open-source", active: false },
  ]);
});

test("post filter options keep unknown active tags out of the tag list", () => {
  const options = getPostFilterOptions(tags, "unknown");

  assert.equal(options[0].href, "/posts");
  assert.equal(options[0].active, false);
  assert.equal(
    options.slice(1).some(({ active }) => active),
    false
  );
});
