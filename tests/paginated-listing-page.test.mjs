import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("paginated listing renders the site header and footer inside the skip-link target", () => {
  const listingPage = read("src/pages/page/[page].astro");

  assert.match(listingPage, /import Header from "\.\.\/\.\.\/components\/Header\.astro";/);
  assert.match(listingPage, /import Footer from "\.\.\/\.\.\/components\/Footer\.astro";/);
  assert.match(listingPage, /<Header \/>/);
  assert.match(listingPage, /<Footer \/>/);
  assert.match(listingPage, /<main\s+id="main-content"/);
});

test("paginated listing renders the shared Pagination component", () => {
  const listingPage = read("src/pages/page/[page].astro");

  assert.match(listingPage, /import Pagination from "\.\.\/\.\.\/components\/Pagination\.astro";/);
  assert.match(listingPage, /<Pagination \{page\} \/>/);
});

test("paginated listing has no hand-written page controls and does not link to the homepage", () => {
  const listingPage = read("src/pages/page/[page].astro");

  assert.doesNotMatch(listingPage, /"\/"/);
  assert.doesNotMatch(listingPage, /href=\{`\/page\//);
});

test("paginated listing sizes pages from SITE.postPerIndex", () => {
  const listingPage = read("src/pages/page/[page].astro");

  assert.match(listingPage, /paginate\(sortedPosts, \{ pageSize: SITE\.postPerIndex \}\)/);
});
