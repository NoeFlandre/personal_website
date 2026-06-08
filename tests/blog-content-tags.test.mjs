import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const allowedTags = new Set(["Publication", "Paper Review", "Project", "Post"]);
const blogDir = new URL("../src/content/blog", import.meta.url);

test("blog posts use exactly one supported top-level tag", () => {
  const files = readdirSync(blogDir).filter((file) => file.endsWith(".md"));

  for (const file of files) {
    const source = readFileSync(join(blogDir.pathname, file), "utf8");
    const { data } = matter(source);

    assert.ok(Array.isArray(data.tags), `${file} must declare tags as an array`);
    assert.equal(data.tags.length, 1, `${file} must have exactly one tag`);
    assert.ok(allowedTags.has(data.tags[0]), `${file} uses unsupported tag "${data.tags[0]}"`);
  }
});
