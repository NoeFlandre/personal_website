import test from "node:test";
import assert from "node:assert/strict";

import { buildArchivesMarkdown, buildPostsMarkdown } from "../src/features/blog/utils/markdownIndexes.ts";

function createPost({
  id,
  filePath = `src/content/blog/${id}.md`,
  title = id,
  pubDatetime = new Date("2025-01-01T00:00:00.000Z"),
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
      draft,
      unlisted,
      tags: ["Post"],
    },
  };
}

test("buildPostsMarkdown uses canonical post paths and excludes hidden posts", () => {
  const markdown = buildPostsMarkdown([
    createPost({
      id: "deep-dive",
      title: "Deep Dive",
      filePath: "src/content/blog/Research Notes/deep-dive.md",
      pubDatetime: new Date("2025-02-01T00:00:00.000Z"),
    }),
    createPost({
      id: "secret",
      title: "Secret",
      pubDatetime: new Date("2025-03-01T00:00:00.000Z"),
      unlisted: true,
    }),
  ]);

  assert.match(markdown, /\[Deep Dive\]\(\/posts\/research-notes\/deep-dive\)/);
  assert.doesNotMatch(markdown, /Secret/);
  assert.doesNotMatch(markdown, /\/posts\/deep-dive\.md/);
});

test("buildArchivesMarkdown counts only visible posts by year", () => {
  const markdown = buildArchivesMarkdown([
    createPost({ id: "a", pubDatetime: new Date("2025-01-01T00:00:00.000Z") }),
    createPost({ id: "b", pubDatetime: new Date("2025-02-01T00:00:00.000Z") }),
    createPost({ id: "draft", pubDatetime: new Date("2025-03-01T00:00:00.000Z"), draft: true }),
    createPost({ id: "older", pubDatetime: new Date("2024-01-01T00:00:00.000Z") }),
  ]);

  assert.match(markdown, /Total posts: 3/);
  assert.match(markdown, /- \[2025\]\(\/posts\.md#2025\) \(2 posts\)/);
  assert.match(markdown, /- \[2024\]\(\/posts\.md#2024\) \(1 post\)/);
});
