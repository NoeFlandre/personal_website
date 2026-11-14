import assert from "node:assert/strict";
import test from "node:test";
import { getPath } from "../src/features/blog/utils/getPath.ts";
import selectHomepageFeatured from "../src/features/blog/utils/selectHomepageFeatured.ts";
import { readRepoFile } from "./helpers/repo-files.mjs";

test("homepage does not render retired work-card titles", () => {
  const homepage = readRepoFile("src/pages/index.astro");
  const survivalGuide = readRepoFile("src/content/blog/2026/survival_guide_in_ai.md");
  const editorPickPost = readRepoFile("src/content/blog/2026/editor-pick-empathy-simulation.md");

  assert.doesNotMatch(homepage, /"A small milestone for our empathy and simulation paper"/);
  assert.doesNotMatch(homepage, /"An AI survival guide"/);
  assert.match(editorPickPost, /featured: true/);
  assert.match(survivalGuide, /featured: false/);
});

test("homepage features exactly three posts and replaces EVERGREEN with the career post", () => {
  const homepage = readRepoFile("src/pages/index.astro");
  const evergreen = readRepoFile("src/content/blog/2026/joining_evergreen.md");
  const careerPost = readRepoFile(
    "src/content/blog/2026/looking-for-my-next-career-opportunity.md"
  );
  const featuredIdsBlock = homepage.match(/const homepageFeaturedIds = \[([\s\S]*?)\];/);

  assert.ok(featuredIdsBlock);
  const featuredIds = [...featuredIdsBlock[1].matchAll(/"([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(featuredIds, [
    "2026/describe-place-on-earth-part1-wikidata",
    "2026/looking-for-my-next-career-opportunity",
    "2026/masked-image-modeling",
  ]);
  assert.match(careerPost, /featured: true/);
  assert.match(evergreen, /featured: false/);
  assert.equal(
    getPath("2026/joining_evergreen", "src/content/blog/2026/joining_evergreen.md"),
    "/posts/2026/joining_evergreen"
  );
});

test("homepage uses the short professional tagline", () => {
  const homepage = readRepoFile("src/pages/index.astro");
  const markdownHomepage = readRepoFile("src/pages/index.md.ts");

  assert.match(homepage, /<p>\s*AI Research Engineer\s*<\/p>/);
  assert.doesNotMatch(homepage, /Geospatial AI & Foundation models/);
  assert.doesNotMatch(homepage, /AI Research Engineer, vibe-learning/);
  assert.doesNotMatch(markdownHomepage, /Daily meal : curating datasets/);
});

test("homepage has no Featured Work section", () => {
  const homepage = readRepoFile("src/pages/index.astro");

  assert.doesNotMatch(homepage, /id="featured-work"/);
  assert.doesNotMatch(homepage, /Featured Work/);
  assert.doesNotMatch(homepage, /featuredWorkCards/);
});

function createPost({ id, pubDatetime, draft = false, unlisted = false }) {
  return { id, data: { pubDatetime: new Date(pubDatetime), draft, unlisted } };
}

test("homepage featured posts keep listed posts from the cutoff year sorted newest first", () => {
  const posts = [
    createPost({ id: "not-featured", pubDatetime: "2025-05-01T12:00:00Z" }),
    createPost({ id: "wikidata", pubDatetime: "2024-01-01T12:00:00Z" }),
    createPost({ id: "masked", pubDatetime: "2025-02-01T12:00:00Z" }),
    createPost({ id: "older", pubDatetime: "2023-06-15T12:00:00Z" }),
    createPost({ id: "draft", pubDatetime: "2025-05-01T12:00:00Z", draft: true }),
    createPost({ id: "unlisted", pubDatetime: "2025-05-01T12:00:00Z", unlisted: true }),
    createPost({ id: "evergreen", pubDatetime: "2025-03-01T12:00:00Z" }),
  ];

  const selected = selectHomepageFeatured(posts, {
    ids: ["evergreen", "wikidata", "masked", "older", "draft", "unlisted"],
    minYear: 2024,
  });

  assert.deepEqual(
    selected.map(({ id }) => id),
    ["evergreen", "masked", "wikidata"]
  );
});

test("homepage featured posts use the minimum year option as the cutoff", () => {
  const posts = [
    createPost({ id: "wikidata", pubDatetime: "2024-01-01T12:00:00Z" }),
    createPost({ id: "evergreen", pubDatetime: "2025-03-01T12:00:00Z" }),
  ];

  const selected = selectHomepageFeatured(posts, {
    ids: ["wikidata", "evergreen"],
    minYear: 2025,
  });

  assert.deepEqual(
    selected.map(({ id }) => id),
    ["evergreen"]
  );
});
