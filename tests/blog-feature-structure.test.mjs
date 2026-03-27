import test from "node:test";
import assert from "node:assert/strict";

import { getAdjacentEntries } from "../src/features/blog/utils/getAdjacentEntries.js";
import { getPath } from "../src/features/blog/utils/getPath.ts";
import getPostsByGroupCondition from "../src/features/blog/utils/getPostsByGroupCondition.ts";
import getPostsByTag from "../src/features/blog/utils/getPostsByTag.ts";
import { getPostStaticPathParams } from "../src/features/blog/utils/staticPaths.ts";
import getSortedPosts from "../src/features/blog/utils/getSortedPosts.ts";
import getUniqueTags from "../src/features/blog/utils/getUniqueTags.ts";
import postFilter from "../src/features/blog/utils/postFilter.ts";
import { createTagInfo, postHasTag } from "../src/features/blog/utils/tags.ts";

test("blog feature utilities are available from the feature-local structure", () => {
  assert.equal(typeof getAdjacentEntries, "function");
  assert.equal(typeof getPath, "function");
  assert.equal(typeof getPostsByGroupCondition, "function");
  assert.equal(typeof getPostsByTag, "function");
  assert.equal(typeof getPostStaticPathParams, "function");
  assert.equal(typeof getSortedPosts, "function");
  assert.equal(typeof getUniqueTags, "function");
  assert.equal(typeof postFilter, "function");
  assert.equal(typeof createTagInfo, "function");
  assert.equal(typeof postHasTag, "function");
});
