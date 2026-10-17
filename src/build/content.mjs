// Loads everything under src/content into plain objects the templates render.

import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { parseFrontMatter } from "./markdown.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-15" -> "15 Oct, 2026" (the format used on noeflandre.com)
export function formatDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date "${iso}" (expected YYYY-MM-DD)`);
  return `${d} ${MONTHS[m - 1]}, ${y}`;
}

// Minutes at 200 words per minute, at least one.
export function readingTime(markdown) {
  const words = String(markdown)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
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

async function loadPosts(dir) {
  const posts = [];
  for (const file of await listFiles(dir, ".md")) {
    const { data, body } = parseFrontMatter(await readFile(file, "utf8"));
    for (const key of ["title", "description", "date"]) {
      if (!data[key]) throw new Error(`${file}: front matter is missing "${key}"`);
    }
    const id = relative(dir, file).split("\\").join("/").replace(/\.md$/, "");
    posts.push({
      ...data,
      id,
      body,
      url: `/posts/${id}/`,
      dateLabel: formatDate(data.date),
      readingTime: Number(data.readingTime) || readingTime(body),
      tags: data.tags || [],
    });
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

async function listFiles(dir, ext) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? listFiles(join(dir, e.name), ext) : e.name.endsWith(ext) ? [join(dir, e.name)] : []))
  );
  return nested.flat().sort();
}
