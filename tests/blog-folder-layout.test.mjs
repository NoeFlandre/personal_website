import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);
const BLOG = "src/content/blog";
const { redirects } = JSON.parse(readFileSync(fromRoot("vercel.json"), "utf8"));

// Posts that used to sit at the blog root. Moving them into a year folder changes their URL,
// so each old URL must redirect to the new one. Date prefixes were dropped from the file names;
// the URL slug never kept them, so the slug is unchanged. Drafts were never public, so they have no redirect.
const MOVED_POSTS = [
  { year: "2026", slug: "design-of-experiments" },
  { year: "2026", slug: "osm-data-analysis" },
  { year: "2026", slug: "monopoly" },
  { year: "2026", slug: "describe-place-on-earth-part1-wikidata" },
  { year: "2026", slug: "distilling_abms" },
  { year: "2026", slug: "editor-pick-empathy-simulation" },
  { year: "2026", slug: "first-review" },
  { year: "2026", slug: "georeasoner" },
  { year: "2026", slug: "giving-agents-hands" },
  { year: "2026", slug: "how2bench" },
  { year: "2026", slug: "hugging-face-language-tags" },
  { year: "2026", slug: "joining_evergreen" },
  { year: "2026", slug: "starting-youtube-channel" },
  { year: "2026", slug: "survival_guide_in_ai" },
];

const isPostFile = (name) => /\.mdx?$/.test(name) && !name.startsWith("_");

test("no blog posts sit at the root of the blog folder", () => {
  const rootPosts = readdirSync(fromRoot(BLOG)).filter(isPostFile);

  assert.deepEqual(rootPosts, []);
});

test("every post sits in the year folder of its publication date", () => {
  const mismatches = [];
  for (const folder of readdirSync(fromRoot(BLOG)).filter((name) => /^\d{4}$/.test(name))) {
    for (const file of readdirSync(fromRoot(`${BLOG}/${folder}`)).filter(isPostFile)) {
      const { data } = matter(readFileSync(fromRoot(`${BLOG}/${folder}/${file}`), "utf8"));
      const year = String(new Date(data.pubDatetime).getUTCFullYear());
      if (year !== folder) mismatches.push(`${folder}/${file} is dated ${year}`);
    }
  }

  assert.deepEqual(mismatches, []);
});

test("every post moved out of the root keeps its old URL by redirecting to the new one", () => {
  const missing = [];
  for (const { year, slug } of MOVED_POSTS) {
    const expected = [
      { source: `/posts/${slug}`, destination: `/posts/${year}/${slug}` },
      { source: `/posts/${slug}.md`, destination: `/posts/${year}/${slug}.md` },
    ];
    for (const { source, destination } of expected) {
      const found = redirects.some(
        (redirect) =>
          redirect.source === source && redirect.destination === destination && redirect.permanent
      );
      if (!found) missing.push(`${source} -> ${destination}`);
    }
  }

  assert.deepEqual(missing, []);
});
