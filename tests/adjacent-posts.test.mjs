import test from "node:test";
import assert from "node:assert/strict";

import { getAdjacentEntries } from "../src/features/blog/utils/getAdjacentEntries.js";

test("getAdjacentEntries returns previous and next entries around the current path", () => {
  const entries = [
    { path: "/posts/third", title: "Third" },
    { path: "/posts/second", title: "Second" },
    { path: "/posts/first", title: "First" },
  ];

  const adjacent = getAdjacentEntries(entries, "/posts/second");

  assert.deepEqual(adjacent, {
    prevEntry: { path: "/posts/third", title: "Third" },
    nextEntry: { path: "/posts/first", title: "First" },
  });
});

test("getAdjacentEntries handles the first and last entries", () => {
  const entries = [
    { path: "/posts/third", title: "Third" },
    { path: "/posts/second", title: "Second" },
    { path: "/posts/first", title: "First" },
  ];

  assert.deepEqual(getAdjacentEntries(entries, "/posts/third"), {
    prevEntry: null,
    nextEntry: { path: "/posts/second", title: "Second" },
  });

  assert.deepEqual(getAdjacentEntries(entries, "/posts/first"), {
    prevEntry: { path: "/posts/second", title: "Second" },
    nextEntry: null,
  });
});

test("getAdjacentEntries returns null neighbors when the current path is missing", () => {
  const entries = [{ path: "/posts/only", title: "Only" }];

  assert.deepEqual(getAdjacentEntries(entries, "/posts/missing"), {
    prevEntry: null,
    nextEntry: null,
  });
});
