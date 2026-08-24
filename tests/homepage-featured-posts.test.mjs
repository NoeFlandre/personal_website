import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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
  assert.match(markdownHomepage, new RegExp(tagline));
  assert.doesNotMatch(homepage, /AI Research Engineer, vibe-learning/);
  assert.doesNotMatch(markdownHomepage, /Daily meal : curating datasets/);
});

test("homepage featured blog posts use the requested order", () => {
  const homepage = read("src/pages/index.astro");
  const wikidataPosition = homepage.indexOf(
    '"How to describe a place on Earth using text? Part 1: wikidata"'
  );
  const evergreenPosition = homepage.indexOf('"I am joining the EVERGREEN research team"');
  const maskedImageModelingPosition = homepage.indexOf(
    '"Breaking down the maths behind Masked Image Modeling"'
  );

  assert.ok(wikidataPosition >= 0);
  assert.ok(wikidataPosition < evergreenPosition);
  assert.ok(evergreenPosition < maskedImageModelingPosition);
  assert.doesNotMatch(homepage, /"From playing Monopoly to AI Research"/);
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
  assert.equal(
    existsSync(new URL("../public/assets/img/about-map/inria-logo.svg", import.meta.url)),
    true
  );
});
