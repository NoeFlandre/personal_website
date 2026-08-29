import { mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import sharp from "sharp";
import {
  getImageThumbnailFileName,
  IMAGE_THUMBNAIL_DIRECTORY,
} from "../src/utils/imageThumbnailPath.mjs";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const CONTENT_DIR = path.join(REPO_ROOT, "src/content");
const MAP_IMAGES_DIR = path.join(PUBLIC_DIR, "assets/img/about-map");
const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_CONCURRENCY = 4;
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

const toLocalPath = (inputPath) =>
  inputPath instanceof URL ? fileURLToPath(inputPath) : inputPath;

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

const isImageFile = (filePath) => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const toPublicPath = (filePath, publicDir = PUBLIC_DIR) => {
  const relativePath = path.relative(publicDir, filePath).split(path.sep).join("/");
  return `/${relativePath}`;
};

async function discoverHeroImages(directory = CONTENT_DIR) {
  const files = await walkFiles(directory);
  const sourcePaths = new Set();

  for (const filePath of files) {
    if (!/\.(?:md|mdx)$/i.test(filePath)) continue;

    const { data } = matter(await readFile(filePath, "utf8"));
    if (typeof data.heroImage === "string" && data.heroImage.startsWith("/")) {
      sourcePaths.add(data.heroImage.split(/[?#]/, 1)[0]);
    }
  }

  return sourcePaths;
}

async function discoverMapImages(directory = MAP_IMAGES_DIR, publicDir = PUBLIC_DIR) {
  const files = await walkFiles(directory);
  return new Set(files.filter(isImageFile).map((filePath) => toPublicPath(filePath, publicDir)));
}

export async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await callback(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

export async function generateThumbnail({ inputPath, outputPath, width = THUMBNAIL_WIDTH }) {
  const inputFilePath = toLocalPath(inputPath);
  await mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(inputFilePath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(outputPath);
}

export async function generateImageThumbnails({
  publicDir = PUBLIC_DIR,
  contentDir = CONTENT_DIR,
} = {}) {
  const outputDirectory = path.join(publicDir, IMAGE_THUMBNAIL_DIRECTORY);
  await mkdir(outputDirectory, { recursive: true });

  const sourcePaths = new Set(["/image.png"]);
  const heroImages = await discoverHeroImages(contentDir);
  const mapImages = await discoverMapImages(
    path.join(publicDir, "assets/img/about-map"),
    publicDir
  );

  for (const sourcePath of [...heroImages, ...mapImages]) {
    sourcePaths.add(sourcePath);
  }

  let skippedCount = 0;
  const sources = [];

  for (const sourcePath of [...sourcePaths].sort()) {
    const inputPath = path.join(publicDir, sourcePath.slice(1));
    let inputStats;

    try {
      inputStats = await stat(inputPath);
    } catch {
      skippedCount += 1;
      console.warn(`[image-thumbnails] Missing source, skipped: ${sourcePath}`);
      continue;
    }

    if (!isImageFile(inputPath)) {
      skippedCount += 1;
      continue;
    }

    sources.push({
      inputPath,
      inputMtimeMs: inputStats.mtimeMs,
      outputPath: path.join(outputDirectory, getImageThumbnailFileName(sourcePath)),
    });
  }

  const expectedOutputs = new Set(sources.map(({ outputPath }) => path.basename(outputPath)));
  const outputEntries = await readdir(outputDirectory, { withFileTypes: true });
  await Promise.all(
    outputEntries
      .filter((entry) => entry.isFile() && !expectedOutputs.has(entry.name))
      .map((entry) => rm(path.join(outputDirectory, entry.name), { force: true }))
  );

  const generated = await mapWithConcurrency(
    sources,
    THUMBNAIL_CONCURRENCY,
    async ({ inputPath, inputMtimeMs, outputPath }) => {
      try {
        const outputStats = await stat(outputPath);
        if (outputStats.mtimeMs >= inputMtimeMs) return false;
      } catch {
        // The preview does not exist yet, so generate it below.
      }

      await generateThumbnail({ inputPath, outputPath });
      return true;
    }
  );

  return { generatedCount: generated.filter(Boolean).length, skippedCount };
}

const isCliInvocation =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliInvocation) {
  const result = await generateImageThumbnails();
  console.log(
    `[image-thumbnails] Generated ${result.generatedCount} previews` +
      (result.skippedCount > 0 ? `; skipped ${result.skippedCount}` : "")
  );
}
