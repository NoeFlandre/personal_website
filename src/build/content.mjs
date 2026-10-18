// Loads everything under src/content into plain objects the templates render.

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { parseFrontMatter, slugify } from "./markdown.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-15" or "2026-10-15T09:00:00+02:00" -> "15 Oct, 2026" (the format used on noeflandre.com)
export function formatDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date "${iso}" (expected YYYY-MM-DD)`);
  return `${d} ${MONTHS[m - 1]}, ${y}`;
}

// Minutes at 200 words per minute, at least one.
export function readingTime(markdown) {
  const words = String(markdown)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\]\([^)]*\)/g, " ")
    .replace(/[#>*_`[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function loadContent(dir) {
  const [site, home, cv] = await Promise.all(["site", "home", "cv"].map((name) => readJson(join(dir, `${name}.json`))));
  const posts = await loadPosts(join(dir, "posts"));
  return { site, home, cv, posts };
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

// Posts live at /posts/<path>, where <path> is the file path without ".md"
// (the URLs of the old site, which links out there still point to).
async function loadPosts(dir) {
  const posts = [];
  for (const file of await listFiles(dir, ".md")) {
    const { data, body } = parseFrontMatter(await readFile(file, "utf8"));
    for (const key of ["title", "description", "date"]) {
      if (!data[key]) throw new Error(`${file}: front matter is missing "${key}"`);
    }
    if (Number.isNaN(Date.parse(data.date))) throw new Error(`${file}: invalid date "${data.date}"`);
    const id = relative(dir, file).split("\\").join("/").replace(/\.md$/, "");
    posts.push({
      ...data,
      id,
      body,
      url: `/posts/${id}`,
      dateLabel: formatDate(data.date),
      readingTime: readingTime(body),
      tags: (data.tags || []).map((name) => ({ name, slug: slugify(name), url: `/tags/${slugify(name)}` })),
    });
  }
  posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  posts.forEach((post, i) => {
    post.newer = posts[i - 1] ?? null;
    post.older = posts[i + 1] ?? null;
  });
  return posts;
}

// Tags in the order of their newest post, each with its posts.
export function groupByTag(posts) {
  const tags = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tags.has(tag.slug)) tags.set(tag.slug, { ...tag, posts: [] });
      tags.get(tag.slug).posts.push(post);
    }
  }
  return [...tags.values()];
}

async function listFiles(dir, ext) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? listFiles(join(dir, e.name), ext) : e.name.endsWith(ext) ? [join(dir, e.name)] : []))
  );
  return nested.flat().sort();
}
