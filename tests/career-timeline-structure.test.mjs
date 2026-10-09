import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/features/about/components/CareerTimeline.astro", import.meta.url),
  "utf8"
);

const countMatches = (pattern) => [...source.matchAll(pattern)].length;

test("career timeline renders its six sections from one section config", () => {
  assert.deepEqual(
    [...source.matchAll(/^\s*id: "([^"]+)",$/gm)].map((match) => match[1]),
    ["publications", "experience", "education", "projects", "awards", "volunteering"]
  );
  assert.equal(countMatches(/<section\b/g), 1);
  assert.equal(countMatches(/<h2\b/g), 1);
});

test("career timeline renders one entry template with one shared title helper", () => {
  assert.equal(countMatches(/absolute -left-\[11px\]/g), 1);
  assert.equal(countMatches(/<h3\b/g), 1);
  assert.equal(countMatches(/const timelineTitle\b/g), 1);
});

test("career timeline renders publication descriptions without a string replace", () => {
  assert.equal(countMatches(/\.replace\(/g), 0);
  assert.equal(countMatches(/set:html=\{item\.descriptionHtml \?\? ""\}/g), 1);
});
