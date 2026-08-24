import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CAREER_TIMELINE_EXPERIENCE } from "../src/features/about/data/careerTimelineData.ts";

const SCHOLAR_URL = "https://scholar.google.com/citations?user=RMhmwNQAAAAJ&hl=fr";
const HTML_SCHOLAR_URL = SCHOLAR_URL.replace("&", "&amp;");
const careerSource = readFileSync(
  new URL("../src/features/about/data/careerTimelineData.ts", import.meta.url),
  "utf8"
);
const testimonialsSource = readFileSync(
  new URL("../src/components/TestimonialsCarousel.astro", import.meta.url),
  "utf8"
);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("all Gérard Dray hyperlinks use his Google Scholar profile", () => {
  const htmlScholarPattern = escapeRegExp(HTML_SCHOLAR_URL);
  const gerardExperience = CAREER_TIMELINE_EXPERIENCE.find(
    (item) => item.title === "AI Research Engineer Intern"
  );

  assert.ok(gerardExperience);
  assert.match(
    gerardExperience.body ?? "",
    new RegExp(`${htmlScholarPattern}[^>]*>Gérard Dray</a>`)
  );
  assert.match(
    testimonialsSource,
    new RegExp(`name: "Gerard Dray",\\s+link: "${escapeRegExp(SCHOLAR_URL)}"`)
  );

  assert.doesNotMatch(careerSource, /linkedin\.com\/in\/gerard-dray/);
  assert.doesNotMatch(testimonialsSource, /linkedin\.com\/in\/gerard-dray/);
});
