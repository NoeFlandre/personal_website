import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AIRBUS_GEO_EXPLORE_URL,
  authorLink,
  externalLink,
} from "../src/features/about/data/links.ts";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const careerSource = readSource("../src/features/about/data/careerTimelineData.ts");
const mapPlacesSource = readSource("../src/features/about/data/aboutMapPlaces.ts");
const indexSource = readSource("../src/pages/index.astro");

test("externalLink renders a new-tab link without an opener", () => {
  assert.equal(
    externalLink("https://example.com/", "Example"),
    '<a href="https://example.com/" target="_blank" rel="noopener noreferrer">Example</a>'
  );
});

test("authorLink renders the underlined accent link used for names", () => {
  assert.equal(
    authorLink("https://example.com/", "Ada Lovelace"),
    '<a href="https://example.com/" target="_blank" rel="noopener noreferrer" class="underline decoration-accent/30 underline-offset-4 hover:text-accent">Ada Lovelace</a>'
  );
});

test("the Airbus Geo Explore URL is defined once and imported by its users", () => {
  for (const source of [careerSource, mapPlacesSource, indexSource]) {
    assert.doesNotMatch(source, /const AIRBUS_GEO_EXPLORE_URL =/);
    assert.doesNotMatch(source, /space-solutions\.airbus\.com/);
  }
  assert.match(AIRBUS_GEO_EXPLORE_URL, /^https:\/\/space-solutions\.airbus\.com\//);
});

test("career timeline builds its anchors with the shared helpers", () => {
  assert.doesNotMatch(careerSource, /<a href=/);
});

test("the HICSS-60 acceptance note is written once", () => {
  assert.equal(careerSource.split("Accepted for HICSS-60").length - 1, 1);
});
