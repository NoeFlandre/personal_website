// Builds the real site in memory and checks the output as a whole.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "../src/build/build.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const { files } = await build({ root, write: false });
const text = (path) => String(files.get(path));
const pages = [...files.keys()].filter((p) => p.endsWith(".html"));
// "/posts/x" for "posts/x/index.html", "/" for "index.html"
const published = new Set([...files.keys()].map((p) => "/" + p.replace(/\/?index\.html$/, "")));

// Every post URL of the old site (its sitemap, October 2026). They were shared, so they must keep working.
const OLD_POST_URLS = [
  "/posts/2026/ai-electricity-water-and-carbon-footprint",
  "/posts/2026/attention-pooling",
  "/posts/2026/looking-for-my-next-career-opportunity",
  "/posts/2026/masked-image-modeling",
  "/posts/2026/new-youtube-video",
  "/posts/2026/rope-pair-index-rotations",
  "/posts/2026/starter-pack-learning-ai",
  "/posts/2026/what-is-openstreetmap",
  "/posts/2026/where-does-the-6np-rule-come-from",
  "/posts/describe-place-on-earth-part1-wikidata",
  "/posts/design-of-experiments",
  "/posts/distilling_abms",
  "/posts/editor-pick-empathy-simulation",
  "/posts/first-review",
  "/posts/georeasoner",
  "/posts/giving-agents-hands",
  "/posts/how2bench",
  "/posts/hugging-face-language-tags",
  "/posts/joining_evergreen",
  "/posts/monopoly",
  "/posts/osm-data-analysis",
  "/posts/starting-youtube-channel",
  "/posts/survival_guide_in_ai",
];

test("every URL of the old site still exists", () => {
  for (const url of [...OLD_POST_URLS, "/", "/posts", "/tags", "/tags/post", "/tags/paper-review", "/tags/publication", "/about", "/rss.xml"]) {
    assert.ok(published.has(url), url);
  }
  for (const file of ["assets/docs/noe-flandre-cv.pdf", "noe-avatar.jpg", "favicon.ico", "sw.js"]) assert.ok(files.has(file), file);
});

test("posts are linked without a trailing slash, as before", () => {
  for (const url of OLD_POST_URLS) {
    const page = text(url.slice(1) + "/index.html");
    assert.match(page, new RegExp(`<link rel="canonical" href="https://noeflandre.com${url}">`), url);
  }
  assert.doesNotMatch(text("index.html"), /href="\/posts\/[^"]*\/"/);
});

test("pages contain no template leftovers", () => {
  for (const path of pages) assert.doesNotMatch(text(path), /undefined|\[object |NaN|\$\{|\{%/, path);
});

test("every internal link and asset resolves", () => {
  for (const path of pages) {
    const page = text(path);
    for (const [, url] of page.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      assert.ok(published.has(url.replace(/\/$/, "") || "/"), `${path} -> ${url}`);
    }
    for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) {
      assert.match(page, new RegExp(`id="${id}"`), `${path} -> #${id}`);
    }
    for (const [, srcset] of page.matchAll(/srcset="([^"]+)"/g)) {
      for (const candidate of srcset.split(", ")) assert.ok(published.has(candidate.split(" ")[0]), `${path} -> ${candidate}`);
    }
  }
});

test("maths is rendered at build time, and only pages with maths load its stylesheet", () => {
  const withMath = text("posts/2026/attention-pooling/index.html");
  assert.match(withMath, /class="katex"/);
  assert.match(withMath, /<link rel="stylesheet" href="\/assets\/katex\/katex\.\w+\.css">/);
  assert.doesNotMatch(text("posts/monopoly/index.html"), /class="katex|katex\.\w+\.css/);
  const css = [...files].find(([p]) => /^assets\/katex\/katex\.\w+\.css$/.test(p));
  for (const [, url] of String(css[1]).matchAll(/url\(([^)]+)\)/g)) assert.ok(files.has(url.slice(1)), url);
});

test("each page ships only the icons it uses", () => {
  for (const path of pages) {
    const page = text(path);
    const defined = new Set([...page.matchAll(/<symbol id="(i-[\w-]+)"/g)].map((m) => m[1]));
    const used = new Set([...page.matchAll(/<use href="#(i-[\w-]+)"/g)].map((m) => m[1]));
    assert.deepEqual([...defined].sort(), [...used].sort(), path);
  }
});

test("the script bundle parses", () => {
  const bundle = [...files].find(([p]) => /^assets\/site\.\w+\.js$/.test(p));
  assert.ok(bundle);
  new Function(String(bundle[1]));
});
