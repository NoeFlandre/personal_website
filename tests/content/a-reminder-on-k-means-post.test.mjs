import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

const postPath = new URL("../../src/content/blog/2026/a-reminder-on-k-means.md", import.meta.url);

test("the k-means post sizes its body figures by panel layout", () => {
  const { content } = matter(readFileSync(postPath, "utf8"));
  const figureWidths = new Map(
    [
      ...content.matchAll(
        /<figure style="width: min\(100%, (\d+)px\);">\s*<img src="\/assets\/img\/2026\/a-reminder-on-k-means\/([^"]+)"/g
      ),
    ].map(([, width, file]) => [file, Number(width)])
  );

  assert.equal(figureWidths.size, 6);
  assert.doesNotMatch(content, /!\[[^\]]*\]\(\/assets\/img\/2026\/a-reminder-on-k-means\//);
  assert.equal((content.match(/<figcaption>Figure \d: /g) ?? []).length, 6);

  // Figures are sized so they render at the same scale (~0.65x source): 461px sources at 300px, 973px sources at 640px.
  for (const file of ["kmeans-init.png", "kmeans-update.png"]) {
    assert.equal(figureWidths.get(file), 300, `${file} should be 300px`);
  }
  for (const file of [
    "supervised-vs-unsupervised-1.png",
    "unsupervised-ambiguity.png",
    "kmeans-local-min.png",
  ]) {
    assert.equal(figureWidths.get(file), 640, `${file} should be 640px`);
  }
  // Figure 4 is a tall 973px panel, shown a little smaller than 640px so it does not dominate the column.
  assert.equal(figureWidths.get("kmeans-assign-1.png"), 560, "kmeans-assign-1.png should be 560px");
});
