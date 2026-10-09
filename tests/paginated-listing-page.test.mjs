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

test("paginated listing links page 1 to the listing instead of the homepage", () => {
  const listingPage = read("src/pages/page/[page].astro");

  assert.doesNotMatch(listingPage, /"\/"/);
  assert.match(listingPage, /href=\{`\/page\/\$\{i \+ 1\}`\}/);
  assert.match(listingPage, /href=\{`\/page\/\$\{currentPage - 1\}`\}/);
});
