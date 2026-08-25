import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";

const postPath = new URL(
  "../src/content/blog/2026/where-does-the-6np-rule-come-from.md",
  import.meta.url
);

test("the 6NP rule post preserves the notes and equation formatting", () => {
  assert.equal(existsSync(postPath), true);
  if (!existsSync(postPath)) return;

  const { data, content } = matter(readFileSync(postPath, "utf8"));

  assert.equal(data.title, "Where does the 6NP rule comes from?");
  assert.equal(data.unlisted, false);
  assert.match(
    content,
    /\\text\{Training FLOPs\} \\approx 6 \\times \\text\{parameters\} \\times \\text\{tokens\}/
  );
  assert.match(
    content,
    /\\underbrace\{\\mathrm\{accumulator\} \+\}_\{\\text\{1 addition\}\}\s*\\underbrace\{w_i x_i\}_\{\\text\{1 multiplication\}\}/
  );
  assert.equal(content.match(/\\underbrace\{2N\}/g)?.length, 3);
  assert.match(content, /= 6N/);
  assert.match(content, /6NP/);
});
