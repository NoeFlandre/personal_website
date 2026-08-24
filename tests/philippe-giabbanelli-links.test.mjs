import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SCHOLAR_URL = "https://scholar.google.com/citations?user=7YilOHoAAAAJ&hl=en";
const sourceFiles = [
  "../src/components/TestimonialsCarousel.astro",
  "../src/features/about/data/careerTimelineData.ts",
  "../src/content/blog/joining_evergreen.md",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const scholarPattern = escapeRegExp(SCHOLAR_URL);
const htmlScholarPattern = escapeRegExp(SCHOLAR_URL.replace("&", "&amp;"));

test("all Philippe Giabbanelli hyperlinks use his Google Scholar profile", () => {
  const [testimonialsSource, careerSource, blogSource] = sourceFiles;

  assert.match(
    testimonialsSource,
    new RegExp(`name: "Philippe Giabbanelli",\\s+link: "${scholarPattern}"`)
  );
  assert.equal((careerSource.match(new RegExp(htmlScholarPattern, "g")) ?? []).length, 1);
  assert.equal((blogSource.match(new RegExp(`\\]\\(${scholarPattern}\\)`, "g")) ?? []).length, 2);

  const allSource = sourceFiles.join("\n");
  assert.doesNotMatch(allSource, /linkedin\.com\/in\/philippe-giabbanelli/);
  assert.doesNotMatch(allSource, /arxiv\.org\/search\/cs\?searchtype=author&amp;query=Giabbanelli/);
  assert.doesNotMatch(allSource, /giabbanelli\.com\/author\/philippe-j\.-giabbanelli/);
});
