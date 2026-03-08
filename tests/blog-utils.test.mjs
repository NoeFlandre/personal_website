import test from "node:test";
import assert from "node:assert/strict";

import { getPath } from "../src/features/blog/utils/getPath.ts";
import getPostsByTag from "../src/features/blog/utils/getPostsByTag.ts";
import getSortedPosts from "../src/features/blog/utils/getSortedPosts.ts";
import getUniqueTags from "../src/features/blog/utils/getUniqueTags.ts";
import postFilter, { isPostVisible } from "../src/features/blog/utils/postFilter.ts";

function createPost({
  id,
  filePath = `src/content/blog/${id}.md`,
  pubDatetime = "2025-01-01T00:00:00.000Z",
  modDatetime,
  draft = false,
  unlisted = false,
  tags = ["Post"],
} = {}) {
  return {
    id,
    filePath,
    data: {
      title: id,
      description: `${id} description`,
      author: "Noe",
      pubDatetime,
      modDatetime,
      draft,
      unlisted,
      tags,
    },
  };
}

test("getPath builds canonical blog URLs from nested content paths", () => {
  assert.equal(getPath("how2bench", "src/content/blog/how2bench.md"), "/posts/how2bench");
  assert.equal(
    getPath("deep-dive", "src/content/blog/Research Notes/deep-dive.md"),
    "/posts/research-notes/deep-dive"
  );
  assert.equal(
    getPath("private-post", "src/content/blog/_drafts/private/private-post.md"),
    "/posts/private/private-post"
  );
  assert.equal(
    getPath("deep-dive", "src/content/blog/Research Notes/deep-dive.md", false),
    "/research-notes/deep-dive"
  );
});

test("isPostVisible handles drafts, unlisted posts, future posts, and dev mode", () => {
  const baseline = {
    pubDatetime: "2025-01-01T00:00:00.000Z",
    draft: false,
    unlisted: false,
    tags: ["Post"],
  };

  assert.equal(isPostVisible(baseline, { now: Date.parse("2025-01-02T00:00:00.000Z") }), true);
  assert.equal(isPostVisible({ ...baseline, draft: true }, { now: Date.now() }), false);
  assert.equal(isPostVisible({ ...baseline, unlisted: true }, { now: Date.now() }), false);
  assert.equal(
    isPostVisible({ ...baseline, pubDatetime: "2099-01-01T00:00:00.000Z" }, { now: Date.now() }),
    false
  );
  assert.equal(
    isPostVisible(
      { ...baseline, pubDatetime: "2099-01-01T00:00:00.000Z" },
      { now: Date.now(), isDev: true }
    ),
    true
  );
});

test("postFilter delegates to the pure visibility helper", () => {
  const post = createPost({ id: "visible" });

  assert.equal(postFilter(post), isPostVisible(post.data));
});

test("getSortedPosts keeps only visible posts and sorts by modified date first", () => {
  const posts = [
    createPost({
      id: "old",
      pubDatetime: "2025-01-01T00:00:00.000Z",
    }),
    createPost({
      id: "newer-modified",
      pubDatetime: "2025-01-01T00:00:00.000Z",
      modDatetime: "2025-02-01T00:00:00.000Z",
    }),
    createPost({
      id: "future",
      pubDatetime: "2099-01-01T00:00:00.000Z",
    }),
  ];

  const sorted = getSortedPosts(posts);

  assert.deepEqual(
    sorted.map((post) => post.id),
    ["newer-modified", "old"]
  );
});

test("getUniqueTags deduplicates, slugifies, and excludes hidden posts", () => {
  const posts = [
    createPost({ id: "a", tags: ["Paper Review", "AI"] }),
    createPost({ id: "b", tags: ["AI", "Open Source"] }),
    createPost({ id: "c", tags: ["Secret"], unlisted: true }),
  ];

  assert.deepEqual(getUniqueTags(posts), [
    { tag: "ai", tagName: "AI" },
    { tag: "open-source", tagName: "Open Source" },
    { tag: "paper-review", tagName: "Paper Review" },
  ]);
});

test("getPostsByTag returns matching visible posts in sorted order", () => {
  const posts = [
    createPost({
      id: "first",
      pubDatetime: "2025-01-01T00:00:00.000Z",
      tags: ["Paper Review"],
    }),
    createPost({
      id: "second",
      pubDatetime: "2025-03-01T00:00:00.000Z",
      tags: ["Paper Review"],
    }),
    createPost({
      id: "hidden",
      pubDatetime: "2025-04-01T00:00:00.000Z",
      tags: ["Paper Review"],
      draft: true,
    }),
  ];

  assert.deepEqual(
    getPostsByTag(posts, "paper-review").map((post) => post.id),
    ["second", "first"]
  );
});
