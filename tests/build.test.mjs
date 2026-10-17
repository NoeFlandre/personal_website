// Builds the real site in memory and checks the output as a whole.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "../src/build/build.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const { files, stale } = await build({ root, check: true });
const text = (path) => String(files.get(path));
const pages = [...files.keys()].filter((p) => p.endsWith(".html"));

test("builds the home page, every post, a 404 and the feeds", () => {
  for (const path of ["index.html", "404.html", "rss.xml", "sitemap.xml", "robots.txt"]) assert.ok(files.has(path), path);
  assert.ok(pages.some((p) => p.startsWith("posts/")), "at least one post");
});

test("pages contain no template leftovers", () => {
  for (const path of pages) assert.doesNotMatch(text(path), /undefined|\[object |NaN|\$\{/, path);
});

test("every internal link and asset resolves", () => {
  const published = new Set([...files.keys()].map((p) => "/" + p.replace(/index\.html$/, "")));
  for (const path of pages) {
    const page = text(path);
    for (const [, url] of page.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      assert.ok(published.has(url) || published.has(url + "/"), `${path} -> ${url}`);
    }
    for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) {
      assert.match(page, new RegExp(`id="${id}"`), `${path} -> #${id}`);
    }
    for (const [, srcset] of page.matchAll(/srcset="([^"]+)"/g)) {
      for (const candidate of srcset.split(", ")) assert.ok(published.has(candidate.split(" ")[0]), `${path} -> ${candidate}`);
    }
  }
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

test("committed dist/ matches the sources (run `node build.mjs` if this fails)", () => {
  assert.deepEqual(stale, []);
});
