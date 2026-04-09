import test from "node:test";
import assert from "node:assert/strict";

import { getPath } from "../src/features/blog/utils/getPath.ts";
import { buildPostLayoutMetadata } from "../src/features/blog/utils/postLayoutMetadata.ts";
import { getPostPath } from "../src/features/blog/utils/postPath.ts";
import { shouldGenerateDynamicOgImage } from "../src/features/blog/utils/ogImages.ts";
import { getPostStaticPathParams } from "../src/features/blog/utils/staticPaths.ts";
import getPostsByTag from "../src/features/blog/utils/getPostsByTag.ts";
import { countWords } from "../src/features/blog/utils/readingMetrics.ts";
import { getDisplayReadingTime, getReadingTimeForPost } from "../src/features/blog/utils/readingTimeText.ts";
import getSortedPosts from "../src/features/blog/utils/getSortedPosts.ts";
import getUniqueTags from "../src/features/blog/utils/getUniqueTags.ts";
import { createTagInfo, getTagPath, postHasTag } from "../src/features/blog/utils/tags.ts";
import postFilter, {
  isDraftFreePost,
  isListedPost,
  isPostVisible,
  isUnlistedPost,
} from "../src/features/blog/utils/postFilter.ts";

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

test("getPostStaticPathParams reuses canonical slug generation without the posts base", () => {
  assert.deepEqual(
    getPostStaticPathParams({
      id: "deep-dive",
      filePath: "src/content/blog/Research Notes/deep-dive.md",
    }),
    { slug: "research-notes/deep-dive" }
  );
});

test("getPostPath derives canonical post URLs directly from a blog entry", () => {
  assert.equal(
    getPostPath({
      id: "deep-dive",
      filePath: "src/content/blog/Research Notes/deep-dive.md",
    }),
    "/posts/research-notes/deep-dive"
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

test("post inclusion helpers keep listed, unlisted, and draft semantics explicit", () => {
  const listed = { draft: false, unlisted: false };
  const unlisted = { draft: false, unlisted: true };
  const draft = { draft: true, unlisted: false };

  assert.equal(isDraftFreePost(listed), true);
  assert.equal(isDraftFreePost(unlisted), true);
  assert.equal(isDraftFreePost(draft), false);
  assert.equal(isListedPost(listed), true);
  assert.equal(isListedPost(unlisted), false);
  assert.equal(isUnlistedPost(unlisted), true);
  assert.equal(isUnlistedPost(listed), false);
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

test("tag helpers normalize tag names consistently across blog utilities", () => {
  const post = createPost({
    id: "tagged",
    tags: ["Paper Review", "Open Source"],
  });

  assert.deepEqual(createTagInfo("Paper Review"), {
    tag: "paper-review",
    tagName: "Paper Review",
  });
  assert.equal(getTagPath("Paper Review"), "/tags/paper-review");
  assert.equal(postHasTag(post, "paper-review"), true);
  assert.equal(postHasTag(post, "open-source"), true);
  assert.equal(postHasTag(post, "swift"), false);
});

test("countWords matches the structured-data word count logic", () => {
  assert.equal(countWords("one two three"), 3);
  assert.equal(countWords(" spaced   words "), 4);
  assert.equal(countWords(""), 1);
});

test("getReadingTimeForPost keeps the existing fallback behavior for missing post bodies", () => {
  assert.equal(getReadingTimeForPost(undefined), "5 min read");
  assert.equal(getReadingTimeForPost({ body: "" }), "5 min read");
  assert.equal(getReadingTimeForPost({ body: "one two three four five" }), "1 min read");
});

test("shouldGenerateDynamicOgImage keeps draft and custom-og posts excluded", () => {
  assert.equal(shouldGenerateDynamicOgImage({ data: { draft: false, ogImage: undefined } }), true);
  assert.equal(shouldGenerateDynamicOgImage({ data: { draft: true, ogImage: undefined } }), false);
  assert.equal(shouldGenerateDynamicOgImage({ data: { draft: false, ogImage: "/custom.png" } }), false);
});

test("getDisplayReadingTime preserves manual overrides before fallback calculation", () => {
  assert.equal(getDisplayReadingTime({ readingTime: "9 min read" }, "short body"), "9 min read");
  assert.equal(getDisplayReadingTime({}, ""), "5 min read");
});

test("buildPostLayoutMetadata centralizes canonical and OG image resolution", () => {
  const metadata = buildPostLayoutMetadata({
    post: {
      id: "deep-dive",
      filePath: "src/content/blog/Research Notes/deep-dive.md",
      data: {
        title: "Deep Dive",
        author: "Noe",
        description: "Research notes",
        pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
        modDatetime: new Date("2025-01-02T00:00:00.000Z"),
        ogImage: undefined,
      },
    },
    siteTitle: "Noe Flandre",
    siteBase: "https://example.com/",
    currentOrigin: "https://preview.local",
    dynamicOgImageEnabled: true,
  });

  assert.equal(metadata.postPath, "/posts/research-notes/deep-dive");
  assert.equal(metadata.canonicalURL, "https://example.com/posts/research-notes/deep-dive");
  assert.equal(
    metadata.ogImage,
    "https://example.com/posts/research-notes/deep-dive/og.png?v=noeflandre-com-3"
  );
  assert.deepEqual(metadata.layoutProps, {
    title: "Deep Dive | Noe Flandre",
    author: "Noe",
    description: "Research notes",
    pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
    modDatetime: new Date("2025-01-02T00:00:00.000Z"),
    canonicalURL: "https://example.com/posts/research-notes/deep-dive",
    ogImage: "https://example.com/posts/research-notes/deep-dive/og.png?v=noeflandre-com-3",
    scrollSmooth: true,
  });
});

test("buildPostLayoutMetadata preserves explicit canonical and local asset OG images", () => {
  const metadata = buildPostLayoutMetadata({
    post: {
      id: "deep-dive",
      filePath: "src/content/blog/deep-dive.md",
      data: {
        title: "Deep Dive",
        author: "Noe",
        description: "Research notes",
        pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
        modDatetime: undefined,
        canonicalURL: "https://canonical.example/post",
        ogImage: { src: "/assets/hero.png" },
      },
    },
    siteTitle: "Noe Flandre",
    siteBase: undefined,
    currentOrigin: "https://preview.local",
    dynamicOgImageEnabled: true,
  });

  assert.equal(metadata.canonicalURL, "https://canonical.example/post");
  assert.equal(metadata.ogImage, "https://preview.local/assets/hero.png");
});
