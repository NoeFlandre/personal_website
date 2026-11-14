import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "@astrojs/markdown-remark";

export class WriterError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "WriterError";
    this.status = status;
  }
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/** Splits a markdown file into its raw YAML block (or null) and the body. */
export function splitFrontmatter(content) {
  const match = FRONTMATTER.exec(content);
  if (!match) return { frontmatter: null, body: content };
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

/** Lowercase, ASCII, dash-separated. Same spirit as the URL slugs the blog already uses. */
export function slugify(title) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Turns a user-supplied relative path into an absolute file path inside `root`. */
export function resolvePostPath(root, relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim() === "") {
    throw new WriterError(400, "Missing post path");
  }
  if (path.isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new WriterError(400, "Path must be relative to the blog folder");
  }

  const full = path.resolve(root, relativePath);
  const relative = path.relative(root, full);
  const escapes =
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative);
  if (escapes) {
    throw new WriterError(400, "Path is outside the blog folder");
  }
  if (path.extname(full) !== ".md") {
    throw new WriterError(400, "Only .md posts can be edited here");
  }

  return { full, path: relative.split(path.sep).join("/") };
}

async function walkMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkMarkdown(full);
      const isPost = entry.name.endsWith(".md") && !entry.name.startsWith("_");
      return isPost ? [full] : [];
    })
  );
  return nested.flat();
}

function summarize(content) {
  try {
    return parseFrontmatter(content).frontmatter ?? {};
  } catch {
    return {};
  }
}

/** Lists posts newest first, the same way the blog's own content loader sees them. */
export async function listPosts(root) {
  const files = await walkMarkdown(root);
  const posts = await Promise.all(
    files.map(async (full) => {
      const content = await readFile(full, "utf8");
      const data = summarize(content);
      const date = data.pubDatetime ? new Date(data.pubDatetime) : null;
      return {
        path: path.relative(root, full).split(path.sep).join("/"),
        title: typeof data.title === "string" ? data.title : "(untitled)",
        pubDatetime: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
        draft: data.draft === true,
      };
    })
  );
  const time = (post) => (post.pubDatetime ? Date.parse(post.pubDatetime) : -Infinity);
  return posts.sort((a, b) => time(b) - time(a));
}

export async function readPost(root, relativePath) {
  const { full, path: postPath } = resolvePostPath(root, relativePath);
  try {
    return { path: postPath, content: await readFile(full, "utf8") };
  } catch (error) {
    if (error.code === "ENOENT") throw new WriterError(404, "Post not found");
    throw error;
  }
}

async function fileExists(full) {
  try {
    return (await stat(full)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

/** Saves an existing post. Creating files goes through createPost, so typos cannot make new posts. */
export async function writePost(root, relativePath, content) {
  const { full, path: postPath } = resolvePostPath(root, relativePath);
  if (!(await fileExists(full))) throw new WriterError(404, "Post not found");
  await writeFile(full, content, "utf8");
  return { path: postPath };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function scaffold(title, now) {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return [
    "---",
    `title: ${JSON.stringify(title)}`,
    'description: "TBD"',
    `pubDatetime: ${date}`,
    "draft: true",
    "---",
    "",
  ].join("\n");
}

/** Creates a draft in the current year's folder, with the same minimal frontmatter as the blog workflow. */
export async function createPost(root, { title, now = new Date() }) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  if (cleanTitle === "") throw new WriterError(400, "Title is required");

  const slug = slugify(cleanTitle);
  if (slug === "") throw new WriterError(400, "Title needs at least one letter or number");

  const { full, path: postPath } = resolvePostPath(root, `${now.getFullYear()}/${slug}.md`);
  if (await fileExists(full)) throw new WriterError(409, "A post with this name already exists");

  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, scaffold(cleanTitle, now), { encoding: "utf8", flag: "wx" });
  return { path: postPath };
}
