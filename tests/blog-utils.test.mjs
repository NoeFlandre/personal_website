import assert from "node:assert/strict";
import test from "node:test";

import { getPath } from "../src/features/blog/utils/getPath.ts";
import getPostsByGroupCondition from "../src/features/blog/utils/getPostsByGroupCondition.ts";
import getPostsByTag from "../src/features/blog/utils/getPostsByTag.ts";
import getSortedPosts from "../src/features/blog/utils/getSortedPosts.ts";
import getUniqueTags, { getUniqueTagInfos } from "../src/features/blog/utils/getUniqueTags.ts";
import { shouldGenerateDynamicOgImage } from "../src/features/blog/utils/ogImages.ts";
import postFilter, {
  isDraftFreePost,
  isListedPost,
  isPostRoutable,
  isPostVisible,
  isUnlistedPost,
} from "../src/features/blog/utils/postFilter.ts";
import { buildPostLayoutMetadata } from "../src/features/blog/utils/postLayoutMetadata.ts";
import { getPostPath } from "../src/features/blog/utils/postPath.ts";
import { countWords } from "../src/features/blog/utils/readingMetrics.ts";
import {
  getDisplayReadingTime,
  getReadingTimeForPost,
} from "../src/features/blog/utils/readingTimeText.ts";
import { getPostStaticPathParams } from "../src/features/blog/utils/staticPaths.ts";
import { createTagInfo, getTagPath, postHasTag } from "../src/features/blog/utils/tags.ts";

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
  assert.equal(
    getPath("2025-02-03-deep-dive", "src/content/blog/deep-dive.md"),
    "/posts/deep-dive"
  );
  assert.equal(
    getPath("archive-2025-02-03-deep-dive", "src/content/blog/deep-dive.md"),
    "/posts/archive-2025-02-03-deep-dive"
  );
  assert.equal(getPath("folder/deep-dive", "src/content/blog/deep-dive.md"), "/posts/deep-dive");
  assert.equal(getPath("folder/", undefined, false), "/");
  assert.equal(getPath("standalone"), "/posts/standalone");
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

test("isPostVisible applies the scheduled-post margin at its boundary", () => {
  const now = Date.parse("2025-01-02T00:00:00.000Z");
  const post = {
    pubDatetime: new Date(now - 900_000).toISOString(),
    draft: false,
    unlisted: false,
    tags: ["Post"],
  };

  assert.equal(isPostVisible(post, { now }), true);
  assert.equal(
    isPostVisible({ ...post, pubDatetime: new Date(now + 900_000 + 1).toISOString() }, { now }),
    false
  );
  assert.equal(
    isPostVisible({ ...post, pubDatetime: new Date(now + 900_000).toISOString() }, { now }),
    false
  );
});

test("isPostRoutable includes published and unlisted posts but excludes drafts and future listed posts", () => {
  const now = Date.parse("2025-01-02T00:00:00.000Z");
  const published = {
    pubDatetime: "2025-01-01T00:00:00.000Z",
    draft: false,
    unlisted: false,
    tags: ["Post"],
  };

  assert.equal(isPostRoutable(published, { now, isDev: false }), true);
  assert.equal(isPostRoutable({ ...published, unlisted: true }, { now, isDev: false }), true);
  assert.equal(isPostRoutable({ ...published, draft: true }, { now, isDev: false }), false);
  assert.equal(
    isPostRoutable(
      { ...published, pubDatetime: "2099-01-01T00:00:00.000Z" },
      { now, isDev: false }
    ),
    false
  );
  assert.equal(
    isPostRoutable(
      { ...published, pubDatetime: "2099-01-01T00:00:00.000Z", unlisted: true },
      { now, isDev: false }
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

test("getUniqueTagInfos keeps the first label for each normalized tag", () => {
  assert.deepEqual(getUniqueTagInfos(["AI", "ai", "Paper Review"]), [
    { tag: "ai", tagName: "AI" },
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
      id: "unrelated",
      pubDatetime: "2025-02-15T00:00:00.000Z",
      tags: ["Other"],
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

test("getPostsByGroupCondition groups posts and passes each original index", () => {
  const posts = [createPost({ id: "a" }), createPost({ id: "b" }), createPost({ id: "c" })];
  const indexes = [];

  const grouped = getPostsByGroupCondition(posts, (post, index) => {
    indexes.push(index);
    return post.id === "b" ? "middle" : "outer";
  });

  assert.deepEqual(indexes, [0, 1, 2]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(grouped).map(([key, values]) => [key, values.map((post) => post.id)])
    ),
    { outer: ["a", "c"], middle: ["b"] }
  );
});

test("getPostsByGroupCondition supports prototype-like group names", () => {
  const grouped = getPostsByGroupCondition(
    [createPost({ id: "prototype-key" }), createPost({ id: "constructor-key" })],
    (post) => (post.id === "prototype-key" ? "__proto__" : "constructor")
  );

  assert.deepEqual(Object.keys(grouped), ["__proto__", "constructor"]);
  assert.deepEqual(
    grouped.__proto__.map((post) => post.id),
    ["prototype-key"]
  );
  assert.deepEqual(
    grouped.constructor.map((post) => post.id),
    ["constructor-key"]
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

test("getDisplayReadingTime falls back when an empty manual override is provided", () => {
  assert.equal(getDisplayReadingTime({ readingTime: "" }, "one two three four five"), "1 min read");
  assert.equal(getDisplayReadingTime(undefined, "one two three four five"), "1 min read");
});

test("shouldGenerateDynamicOgImage follows routability and custom-og rules", () => {
  const visiblePost = {
    draft: false,
    unlisted: false,
    pubDatetime: "2025-01-01T00:00:00.000Z",
    ogImage: undefined,
  };

  assert.equal(shouldGenerateDynamicOgImage({ data: visiblePost }), true);
  assert.equal(shouldGenerateDynamicOgImage({ data: { ...visiblePost, draft: true } }), false);
  assert.equal(
    shouldGenerateDynamicOgImage({ data: { ...visiblePost, ogImage: "/custom.png" } }),
    false
  );
  assert.equal(
    shouldGenerateDynamicOgImage({
      data: { ...visiblePost, pubDatetime: "2099-01-01T00:00:00.000Z" },
    }),
    false
  );
  assert.equal(
    shouldGenerateDynamicOgImage({
      data: {
        ...visiblePost,
        pubDatetime: "2099-01-01T00:00:00.000Z",
        unlisted: true,
      },
    }),
    true
  );
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

test("buildPostLayoutMetadata falls back for an OG image object without a source", () => {
  const metadata = buildPostLayoutMetadata({
    post: {
      id: "deep-dive",
      filePath: "src/content/blog/deep-dive.md",
      data: {
        title: "Deep Dive",
        ogImage: {},
      },
    },
    siteTitle: "Noe Flandre",
    siteBase: "https://example.com",
    currentOrigin: "https://preview.local",
    dynamicOgImageEnabled: true,
  });

  assert.equal(metadata.ogImage, "https://example.com/posts/deep-dive/og.png?v=noeflandre-com-3");
});

test("buildPostLayoutMetadata supports string OG images and disables dynamic fallback", () => {
  const metadata = buildPostLayoutMetadata({
    post: {
      id: "deep-dive",
      filePath: "src/content/blog/deep-dive.md",
      data: {
        title: "Deep Dive",
        author: "Noe",
        description: "Research notes",
        pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
        modDatetime: null,
        ogImage: "/assets/hero.png",
      },
    },
    siteTitle: "Noe Flandre",
    siteBase: "https://example.com",
    currentOrigin: "https://preview.local",
    dynamicOgImageEnabled: false,
  });

  assert.equal(metadata.ogImage, "https://example.com/assets/hero.png");
  assert.equal(metadata.layoutProps.modDatetime, null);
});

test("buildPostLayoutMetadata leaves OG images empty when dynamic generation is disabled", () => {
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
      },
    },
    siteTitle: "Noe Flandre",
    currentOrigin: "https://preview.local",
    dynamicOgImageEnabled: false,
  });

  assert.equal(metadata.ogImage, undefined);
});
