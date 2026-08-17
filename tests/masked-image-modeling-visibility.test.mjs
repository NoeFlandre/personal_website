import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

import { isListedPost } from "../src/features/blog/utils/postFilter.ts";

test("masked image modeling is included in the public blog listing", () => {
  const source = readFileSync(
    new URL("../src/content/blog/2026/masked-image-modeling.md", import.meta.url),
    "utf8"
  );
  const { data } = matter(source);

  assert.equal(isListedPost(data), true);
});
