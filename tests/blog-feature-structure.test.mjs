import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAdjacentEntries } from "../src/features/blog/utils/getAdjacentEntries.js";
import { getPath } from "../src/features/blog/utils/getPath.ts";
import getPostsByGroupCondition from "../src/features/blog/utils/getPostsByGroupCondition.ts";
import getPostsByTag from "../src/features/blog/utils/getPostsByTag.ts";
import getSortedPosts from "../src/features/blog/utils/getSortedPosts.ts";
import getUniqueTags from "../src/features/blog/utils/getUniqueTags.ts";
import { shouldGenerateDynamicOgImage } from "../src/features/blog/utils/ogImages.ts";
import postFilter, {
  isDraftFreePost,
  isListedPost,
  isPostRoutable,
  isUnlistedPost,
} from "../src/features/blog/utils/postFilter.ts";
import { getPostPath } from "../src/features/blog/utils/postPath.ts";
import { getPostStaticPathParams } from "../src/features/blog/utils/staticPaths.ts";
import { createTagInfo, getTagPath, postHasTag } from "../src/features/blog/utils/tags.ts";

test("blog feature utilities are available from the feature-local structure", () => {
  assert.equal(typeof getAdjacentEntries, "function");
  assert.equal(typeof getPath, "function");
  assert.equal(typeof getPostPath, "function");
  assert.equal(typeof shouldGenerateDynamicOgImage, "function");
  assert.equal(typeof getPostsByGroupCondition, "function");
  assert.equal(typeof getPostsByTag, "function");
  assert.equal(typeof isDraftFreePost, "function");
  assert.equal(typeof isListedPost, "function");
  assert.equal(typeof isPostRoutable, "function");
  assert.equal(typeof isUnlistedPost, "function");
  assert.equal(typeof getPostStaticPathParams, "function");
  assert.equal(typeof getSortedPosts, "function");
  assert.equal(typeof getUniqueTags, "function");
  assert.equal(typeof postFilter, "function");
  assert.equal(typeof createTagInfo, "function");
  assert.equal(typeof getTagPath, "function");
  assert.equal(typeof postHasTag, "function");
});

test("blog tag presentation uses the shared filter route helper", () => {
  const tagComponent = readFileSync(
    new URL("../src/components/Tag.astro", import.meta.url),
    "utf8"
  );
  const tagPage = readFileSync(
    new URL("../src/pages/tags/[tag]/[...page].astro", import.meta.url),
    "utf8"
  );
  const filterBar = readFileSync(
    new URL("../src/features/blog/components/PostFilterBar.astro", import.meta.url),
    "utf8"
  );
  const filterOptions = readFileSync(
    new URL("../src/features/blog/utils/getPostFilterOptions.ts", import.meta.url),
    "utf8"
  );

  assert.match(tagComponent, /getTagPath/);
  assert.match(filterOptions, /getTagPath/);
  assert.match(filterBar, /getPostFilterOptions/);
  assert.match(tagPage, /PostFilterBar/);
});
