import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

const postPath = new URL("../src/content/blog/2026/a-reminder-on-k-means.md", import.meta.url);

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

  // Single-panel figures (461px source) are sized to Figure 1's rendered height (~240px at 640px wide).
  for (const file of ["kmeans-init.png", "kmeans-assign-1.png", "kmeans-update.png"]) {
    assert.equal(figureWidths.get(file), 300, `${file} should be 300px`);
  }
  for (const file of [
    "supervised-vs-unsupervised-1.png",
    "unsupervised-ambiguity.png",
    "kmeans-local-min.png",
  ]) {
    assert.equal(figureWidths.get(file), 640, `${file} should be 640px`);
  }
});
