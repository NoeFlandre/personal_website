import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

const postPath = new URL("../src/content/blog/2026/rope-pair-index-rotations.md", import.meta.url);
const heroSourcePath = new URL(
  "../public/assets/img/2026/rope-pair-index-rotations/tikz/rope-hero.tex",
  import.meta.url
);

test("the RoPE pair-index post preserves the notes and local-review metadata", () => {
  assert.equal(existsSync(postPath), true);
  if (!existsSync(postPath)) return;

  const { data, content } = matter(readFileSync(postPath, "utf8"));

  assert.equal(data.title, "RoPE: How to find the pair index that rotates N times");
  assert.equal(data.pubDatetime.toISOString(), "2026-08-28T10:00:00.000Z");
  assert.equal(data.unlisted, false);
  assert.equal(data.heroImage, "/assets/img/2026/rope-pair-index-rotations/rope-hero.svg");
  assert.match(content, /For the pair index \$i\$, the associated frequency is/);
  assert.match(content, /\\omega_i = \\frac\{1\}\{\\mathrm\{base\}\^\{2i\/d\}\}/);
  assert.match(content, /\\boxed\{/);
  assert.match(content, /This is the pair \$i\$ whose RoPE frequency makes \$N\$ rotations/);
  assert.doesNotMatch(content, /^\\\[/m);
  assert.doesNotMatch(content, /^\\\]$/m);

  assert.equal(existsSync(heroSourcePath), true);
  if (!existsSync(heroSourcePath)) return;

  const heroSource = readFileSync(heroSourcePath, "utf8");
  assert.match(heroSource, /circle \(1\.45\)/);
  assert.match(heroSource, /R_\{\\theta\}x_i/);
  assert.match(heroSource, /node\[pos=1, above right=6pt, fill=white, inner sep=1pt\]/);
  assert.doesNotMatch(heroSource, /L\\omega_i|\\mathrm\{base\}|\\ln/);
});
