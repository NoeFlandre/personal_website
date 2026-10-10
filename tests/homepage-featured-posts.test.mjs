import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import selectHomepageFeatured from "../src/features/blog/utils/selectHomepageFeatured.ts";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homepage does not render retired work-card titles", () => {
  const homepage = read("src/pages/index.astro");
  const survivalGuide = read("src/content/blog/survival_guide_in_ai.md");
  const editorPickPost = read("src/content/blog/editor-pick-empathy-simulation.md");

  assert.doesNotMatch(homepage, /"A small milestone for our empathy and simulation paper"/);
  assert.doesNotMatch(homepage, /"An AI survival guide"/);
  assert.match(editorPickPost, /featured: true/);
  assert.match(survivalGuide, /featured: false/);
});

test("homepage uses the current professional tagline", () => {
  const homepage = read("src/pages/index.astro");
  const markdownHomepage = read("src/pages/index.md.ts");
  const tagline = "AI Research Engineer — Geospatial AI & Foundation models";

  assert.match(homepage, new RegExp(tagline));
  assert.doesNotMatch(homepage, /AI Research Engineer, vibe-learning/);
  assert.doesNotMatch(markdownHomepage, /Daily meal : curating datasets/);
});

test("homepage describes selected work across the three focus areas", () => {
  const homepage = read("src/pages/index.astro");

  assert.match(homepage, /Selected work across research, industry and humanitarian volunteering\./);
});

test("homepage featured work starts with GeoReSeT and keeps Airbus before Tsiky", () => {
  const homepage = read("src/pages/index.astro");
  const geoResetPosition = homepage.indexOf('title: "GeoReSeT"');
  const airbusPosition = homepage.indexOf('title: "Airbus Defence and Space"');
  const tsikyPosition = homepage.indexOf('title: "Tsiky Zanaka Classroom Project"');

  assert.ok(geoResetPosition >= 0);
  assert.ok(geoResetPosition < airbusPosition);
  assert.ok(airbusPosition < tsikyPosition);
  assert.match(homepage, /label: "Research"/);
  assert.match(homepage, /label: "Industry Research"/);
  assert.ok(
    homepage.includes(
      "Vision-language models and fine-tuning on satellite imagery for Airbus Geo Explore."
    )
  );
  assert.ok(
    homepage.includes(
      "Multimodal geospatial foundation models connecting text, maps and remote-sensing imagery."
    )
  );
  assert.ok(homepage.includes("Helped in building a classroom in Namibia"));
  assert.match(homepage, /href: "https:\/\/geo-reset\.sylvainlobry\.com\/"/);
  assert.match(homepage, /image: "\/assets\/img\/about-map\/inria-logo\.svg"/);
  assert.doesNotMatch(homepage, /Empathetic Narratives from ABMs/);
});

function createPost({ id, pubDatetime, draft = false, unlisted = false }) {
  return { id, data: { pubDatetime: new Date(pubDatetime), draft, unlisted } };
}

test("homepage featured posts keep listed posts from the cutoff year in the requested id order", () => {
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
    ["evergreen", "wikidata", "masked"]
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
