import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/components/TestimonialsCarousel.astro", import.meta.url),
  "utf8"
);

test("Johann Desloires is the second linked recommendation", () => {
  const names = [...source.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);

  assert.equal(names[1], "Johann Desloires");
  assert.match(source, /link: "https:\/\/www\.linkedin\.com\/in\/johann-desloires\/"/);
  assert.match(source, /title: "Geospatial Data Scientist \| EO & ML \| End-to-End Applications"/);
  assert.match(source, /relationship: "Worked with Noé on the same team"/);
  assert.match(source, /date: "August 19, 2026"/);
  assert.match(
    source,
    /quote:\s*"I had the pleasure of meeting Noé during his internship at Airbus Defence and Space/
  );
  assert.match(
    source,
    /I wish Noé all the best for the next steps of his career and would be happy to recommend him\./
  );
});

test("TestimonialsCarousel delegates browser behavior to its bundled client module", () => {
  assert.match(
    source,
    /<script>[\s\S]*import\s+\{\s*startTestimonialsCarousels\s*\}\s+from\s+"@\/features\/about\/client\/testimonialsCarousel\.js";[\s\S]*startTestimonialsCarousels\(\);[\s\S]*<\/script>/
  );
  assert.doesNotMatch(source, /<script is:inline>/);
  assert.doesNotMatch(source, /querySelectorAll\("\[data-testimonial-carousel\]"\)/);
  assert.doesNotMatch(source, /ResizeObserver/);
});
