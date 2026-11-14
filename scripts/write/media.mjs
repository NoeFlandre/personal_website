import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolvePostPath, splitFrontmatter, WriterError } from "./posts.mjs";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const KINDS = {
  ".avif": "image",
  ".gif": "image",
  ".jpeg": "image",
  ".jpg": "image",
  ".png": "image",
  ".svg": "image",
  ".webp": "image",
  ".mp4": "video",
  ".webm": "video",
};

// Checks the first bytes so a renamed file cannot be uploaded as an image.
const SIGNATURES = {
  ".avif": (b) => b.subarray(4, 8).toString("ascii") === "ftyp",
  ".gif": (b) => b.subarray(0, 4).toString("ascii") === "GIF8",
  ".jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  ".jpg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  ".png": (b) =>
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ".svg": (b) => {
    const head = b.subarray(0, 4096).toString("utf8");
    return head.includes("<svg") && !/<script/i.test(b.toString("utf8"));
  },
  ".webp": (b) =>
    b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  ".mp4": (b) => b.subarray(4, 8).toString("ascii") === "ftyp",
  ".webm": (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
};

/** Post "2026/attention-pooling.md" keeps its media in public/assets/img/2026/attention-pooling/. */
export function mediaFolderFor(postPath) {
  return `assets/img/${postPath.replace(/\.md$/, "")}`;
}

export function sanitizeFilename(name) {
  const base = path
    .basename(String(name ?? ""))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
  const ext = path.extname(base).toLowerCase();
  const stem = base
    .slice(0, base.length - path.extname(base).length)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return { stem: stem || "upload", ext };
}

async function uniqueName(folder, stem, ext) {
  for (let index = 1; ; index += 1) {
    const name = index === 1 ? `${stem}${ext}` : `${stem}-${index}${ext}`;
    try {
      await stat(path.join(folder, name));
    } catch (error) {
      if (error.code === "ENOENT") return name;
      throw error;
    }
  }
}

/** Saves an uploaded image or video next to the post and returns the URL to use in markdown. */
export async function saveUpload({ root, publicDir, postPath, filename, data }) {
  const { path: relativePost, full } = resolvePostPath(root, postPath);
  try {
    if (!(await stat(full)).isFile()) throw new WriterError(404, "Post not found");
  } catch (error) {
    if (error instanceof WriterError) throw error;
    throw new WriterError(404, "Post not found");
  }

  const { stem, ext } = sanitizeFilename(filename);
  const kind = KINDS[ext];
  if (!kind) throw new WriterError(415, "Only images and mp4/webm videos can be uploaded");
  if (data.length === 0) throw new WriterError(400, "The file is empty");
  if (data.length > MAX_UPLOAD_BYTES) throw new WriterError(413, "File is larger than 25 MB");
  if (!SIGNATURES[ext](data))
    throw new WriterError(415, "The file content does not match its extension");

  const folder = path.join(publicDir, mediaFolderFor(relativePost));
  await mkdir(folder, { recursive: true });
  const name = await uniqueName(folder, stem, ext);
  await writeFile(path.join(folder, name), data, { flag: "wx" });

  return { name, kind, url: `/${mediaFolderFor(relativePost)}/${name}` };
}

/** Lists the media already uploaded for a post, so it can be reused without re-uploading. */
export async function listMedia({ publicDir, postPath }) {
  const { path: relativePost } = resolvePostPath("/", postPath);
  const folder = path.join(publicDir, mediaFolderFor(relativePost));
  let names;
  try {
    names = await readdir(folder);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return names
    .filter((name) => KINDS[path.extname(name).toLowerCase()])
    .sort()
    .map((name) => ({
      name,
      kind: KINDS[path.extname(name).toLowerCase()],
      url: `/${mediaFolderFor(relativePost)}/${name}`,
    }));
}

function upsertLine(lines, key, value) {
  const line = `${key}: ${JSON.stringify(value)}`;
  const index = lines.findIndex((existing) => existing.startsWith(`${key}:`));
  if (index >= 0) lines[index] = line;
  else lines.push(line);
}

/** Sets heroImage (and heroImageAlt when given) in the post's frontmatter, leaving everything else alone. */
export function setHeroFields(content, { url, alt }) {
  const { frontmatter, body } = splitFrontmatter(content);
  if (frontmatter === null)
    throw new WriterError(400, "This post has no frontmatter to store the hero in");

  const lines = frontmatter.split("\n");
  upsertLine(lines, "heroImage", url);
  if (typeof alt === "string" && alt.trim() !== "") upsertLine(lines, "heroImageAlt", alt.trim());
  return `---\n${lines.join("\n")}\n---\n${body}`;
}
