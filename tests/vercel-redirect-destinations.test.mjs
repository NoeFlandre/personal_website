import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import test from "node:test";
import matter from "gray-matter";
import { getPath } from "../src/features/blog/utils/getPath.ts";
import { isPostRoutable } from "../src/features/blog/utils/postFilter.ts";
import { repoUrl } from "./helpers/repo-files.mjs";

const { redirects } = JSON.parse(readFileSync(repoUrl("vercel.json"), "utf8"));

// Post URLs exactly as the blog routes generate them: same visibility filter and slug rules.
const postUrls = new Set(
  readdirSync(repoUrl("src/content/blog"), { recursive: true })
    .filter((file) => /\.mdx?$/.test(file) && !basename(file).startsWith("_"))
    .filter((file) =>
      isPostRoutable(matter(readFileSync(repoUrl(`src/content/blog/${file}`), "utf8")).data)
    )
    .map((file) => getPath(basename(file, extname(file)), `src/content/blog/${file}`))
);

const pageExists = (page) => existsSync(repoUrl(`src/pages${page}`));

function resolvesToRoute(destination) {
  const param = destination.indexOf(":");
  if (param !== -1) {
    // Parameterized destination: its static prefix must be a real page directory.
    return pageExists(destination.slice(0, param));
  }
  if (destination.startsWith("/posts/")) {
    // "/posts/<slug>.md" is the raw-markdown endpoint for the same post, generated from the same posts.
    return postUrls.has(destination.replace(/\.md$/, ""));
  }
  return pageExists(`${destination}.astro`) || pageExists(`${destination}/index.astro`);
}

test("every same-site redirect destination resolves to a real route", () => {
  // Absolute destinations (the host catch-all) point off this site, so they have no local route.
  const unresolved = redirects
    .map(({ destination }) => destination)
    .filter((destination) => destination.startsWith("/"))
    .filter((destination) => !resolvesToRoute(destination));

  assert.deepEqual(unresolved, []);
});
