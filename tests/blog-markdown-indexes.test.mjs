import assert from "node:assert/strict";
import test from "node:test";

import {
  buildArchivesMarkdown,
  buildPostsMarkdown,
  getPostsByYear,
} from "../src/features/blog/utils/markdownIndexes.ts";

// Host zone is ahead of SITE.timezone (America/Los_Angeles), so host-clock dates would change results.
process.env.TZ = "Asia/Tokyo";

function createPost({
  id,
  filePath = `src/content/blog/${id}.md`,
  title = id,
  pubDatetime = new Date("2025-01-01T12:00:00.000Z"),
  modDatetime,
  draft = false,
  unlisted = false,
} = {}) {
  return {
    id,
    filePath,
    data: {
      title,
      description: `${title} description`,
      author: "Noe",
      pubDatetime,
      modDatetime,
      draft,
      unlisted,
      tags: ["Post"],
    },
  };
}

test("getPostsByYear returns visible posts grouped in descending publication years", () => {
  const groups = getPostsByYear([
    createPost({
      id: "newer",
      pubDatetime: new Date("2025-02-01T12:00:00.000Z"),
      modDatetime: new Date("2024-01-01T00:00:00.000Z"),
    }),
    createPost({
      id: "older",
      pubDatetime: new Date("2024-12-01T12:00:00.000Z"),
      modDatetime: new Date("2025-01-01T00:00:00.000Z"),
    }),
    createPost({ id: "hidden", draft: true, pubDatetime: new Date("2026-01-01T12:00:00.000Z") }),
  ]);

  assert.deepEqual(
    groups.map(({ year, posts }) => ({
      year,
      posts: posts.map((post) => post.id),
    })),
    [
      { year: 2025, posts: ["newer"] },
      { year: 2024, posts: ["older"] },
    ]
  );
});

test("getPostsByYear assigns years in the site timezone rather than the host timezone", () => {
  // 2025-01-01T04:00Z is still 2024-12-31 in America/Los_Angeles.
  const groups = getPostsByYear([
    createPost({ id: "new-years-eve", pubDatetime: new Date("2025-01-01T04:00:00.000Z") }),
  ]);

  assert.deepEqual(
    groups.map(({ year, posts }) => ({ year, posts: posts.map((post) => post.id) })),
    [{ year: 2024, posts: ["new-years-eve"] }]
  );
});

test("buildPostsMarkdown labels days in the site timezone rather than the host timezone", () => {
  // 2025-02-01T04:00Z is Jan 31 in America/Los_Angeles.
  const markdown = buildPostsMarkdown([
    createPost({
      id: "month-end",
      title: "Month End",
      pubDatetime: new Date("2025-02-01T04:00:00.000Z"),
    }),
  ]);

  assert.equal(
    markdown,
    "# All Posts\n\n## 2025\n\n- Jan 31: [Month End](/posts/month-end)\n\n---\n\n[Back to Home](/index.md)"
  );
});

test("buildPostsMarkdown uses canonical post paths and excludes hidden posts", () => {
  const markdown = buildPostsMarkdown([
    createPost({
      id: "deep-dive",
      title: "Deep Dive",
      filePath: "src/content/blog/Research Notes/deep-dive.md",
      pubDatetime: new Date("2025-02-01T12:00:00.000Z"),
    }),
    createPost({
      id: "same-year",
      title: "Same Year",
      pubDatetime: new Date("2025-01-15T12:00:00.000Z"),
    }),
    createPost({
      id: "older-year",
      title: "Older Year",
      pubDatetime: new Date("2024-12-01T12:00:00.000Z"),
    }),
    createPost({
      id: "secret",
      title: "Secret",
      pubDatetime: new Date("2025-03-01T12:00:00.000Z"),
      unlisted: true,
    }),
  ]);

  assert.equal(
    markdown,
    "# All Posts\n\n## 2025\n\n- Feb 1: [Deep Dive](/posts/research-notes/deep-dive)\n- Jan 15: [Same Year](/posts/same-year)\n\n## 2024\n\n- Dec 1: [Older Year](/posts/older-year)\n\n---\n\n[Back to Home](/index.md)"
  );
});

test("buildArchivesMarkdown counts only visible posts by year", () => {
  const markdown = buildArchivesMarkdown([
    createPost({ id: "a", pubDatetime: new Date("2025-01-01T12:00:00.000Z") }),
    createPost({ id: "b", pubDatetime: new Date("2025-02-01T12:00:00.000Z") }),
    createPost({ id: "draft", pubDatetime: new Date("2025-03-01T12:00:00.000Z"), draft: true }),
    createPost({ id: "older", pubDatetime: new Date("2024-01-01T12:00:00.000Z") }),
  ]);

  assert.equal(
    markdown,
    "# Archives\n\nTotal posts: 3\n\n## Posts by Year\n\n- [2025](/posts.md#2025) (2 posts)\n- [2024](/posts.md#2024) (1 post)\n\n---\n\n[Back to Home](/index.md) | [All Posts](/posts.md)"
  );
});
