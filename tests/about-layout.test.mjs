import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const aboutSource = readFileSync(new URL("../src/pages/about.mdx", import.meta.url), "utf8");
const aboutMapSource = readFileSync(
  new URL("../src/features/about/components/AboutTravelMap.astro", import.meta.url),
  "utf8"
);

test("about intro text aligns its first paragraph with the image top", () => {
  assert.match(aboutSource, /class="flex-1 min-w-0 \[&>p:first-child\]:!mt-0"/);
});

test("About map styles do not retain unused eyebrow or subtitle selectors", () => {
  assert.doesNotMatch(aboutMapSource, /\.about-map__eyebrow/);
  assert.doesNotMatch(aboutMapSource, /\.about-map__subtitle/);
});
