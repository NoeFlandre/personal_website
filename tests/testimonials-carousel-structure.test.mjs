import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("TestimonialsCarousel avoids unused map callback parameters", () => {
  const source = readFileSync(
    new URL("../src/components/TestimonialsCarousel.astro", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /testimonials\.map\(\(item,\s*index\)\s*=>\s*\(\s*<li/);
  assert.doesNotMatch(source, /testimonials\.map\(\(item,\s*index\)\s*=>\s*\(\s*<button/);
  assert.match(source, /testimonials\.map\(\(item\)\s*=>\s*\(\s*<li/);
  assert.match(source, /testimonials\.map\(\(_?,?\s*index\)\s*=>\s*\(\s*<button/);
});
