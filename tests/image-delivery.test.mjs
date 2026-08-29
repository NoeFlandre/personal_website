import assert from "node:assert/strict";
import { existsSync, readFileSync as readFile } from "node:fs";
import { mkdir, mkdtemp, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

const rootUrl = (filePath) => new URL(`../${filePath}`, import.meta.url);
const read = (filePath) => readFile(rootUrl(filePath), "utf8");

async function loadThumbnailPath() {
  try {
    return await import("../src/utils/imageThumbnailPath.mjs");
  } catch {
    assert.fail("imageThumbnailPath.mjs should exist");
  }
}

async function loadThumbnailGenerator() {
  try {
    return await import("../scripts/generate-image-thumbnails.mjs");
  } catch {
    assert.fail("generate-image-thumbnails.mjs should exist");
  }
}

test("preview URLs are deterministic and stay separate from originals", async () => {
  const { getImageThumbnailFileName, getImageThumbnailPath } = await loadThumbnailPath();

  assert.equal(getImageThumbnailPath("/youtube.png"), "/generated/image-thumbnails/youtube.webp");
  assert.equal(
    getImageThumbnailPath("/assets/img/2026/masked-image-modeling/hero.svg"),
    "/generated/image-thumbnails/assets--img--2026--masked-image-modeling--hero.webp"
  );
  assert.equal(
    getImageThumbnailPath("/assets/img/about-map/lac_léman_travel.jpeg"),
    "/generated/image-thumbnails/assets--img--about-map--lac_l%C3%A9man_travel.webp"
  );
  assert.equal(
    getImageThumbnailFileName("/assets/img/about-map/lac_léman_travel.jpeg"),
    "assets--img--about-map--lac_léman_travel.webp"
  );
  assert.notEqual(getImageThumbnailPath("/youtube.png"), "/youtube.png");
});

test("thumbnail generation writes a bounded WebP", async () => {
  const { generateThumbnail } = await loadThumbnailGenerator();
  const tempDir = await mkdtemp(path.join(tmpdir(), "image-thumb-test-"));

  try {
    const outputPath = path.join(tempDir, "preview.webp");
    await generateThumbnail({
      inputPath: rootUrl("public/noe-avatar.jpg"),
      outputPath,
      width: 320,
    });

    const metadata = await sharp(outputPath).metadata();
    assert.equal(metadata.format, "webp");
    assert.ok(metadata.width <= 320);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("thumbnail generation reuses unchanged previews and refreshes changed sources", async () => {
  const { generateImageThumbnails } = await loadThumbnailGenerator();
  const tempDir = await mkdtemp(path.join(tmpdir(), "image-thumb-cache-test-"));
  const publicDir = path.join(tempDir, "public");
  const contentDir = path.join(tempDir, "content");
  const sourcePath = path.join(publicDir, "image.png");
  const outputPath = path.join(publicDir, "generated/image-thumbnails/image.webp");

  try {
    await mkdir(path.join(publicDir, "assets/img/about-map"), { recursive: true });
    await mkdir(contentDir, { recursive: true });
    await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 20, g: 40, b: 60 } },
    })
      .png()
      .toFile(sourcePath);

    const firstRun = await generateImageThumbnails({ publicDir, contentDir });
    const secondRun = await generateImageThumbnails({ publicDir, contentDir });

    assert.equal(firstRun.generatedCount, 1);
    assert.equal(secondRun.generatedCount, 0);
    assert.equal(existsSync(outputPath), true);

    await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 180, g: 90, b: 30 } },
    })
      .png()
      .toFile(sourcePath);
    const future = new Date((await stat(sourcePath)).mtimeMs + 2_000);
    await utimes(sourcePath, future, future);

    const thirdRun = await generateImageThumbnails({ publicDir, contentDir });
    assert.equal(thirdRun.generatedCount, 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("thumbnail generation removes previews whose sources no longer exist", async () => {
  const { generateImageThumbnails } = await loadThumbnailGenerator();
  const tempDir = await mkdtemp(path.join(tmpdir(), "image-thumb-stale-test-"));
  const publicDir = path.join(tempDir, "public");
  const contentDir = path.join(tempDir, "content");
  const sourcePath = path.join(publicDir, "image.png");
  const outputPath = path.join(publicDir, "generated/image-thumbnails/image.webp");

  try {
    await mkdir(path.join(publicDir, "assets/img/about-map"), { recursive: true });
    await mkdir(contentDir, { recursive: true });
    await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 20, g: 40, b: 60 } },
    })
      .png()
      .toFile(sourcePath);

    await generateImageThumbnails({ publicDir, contentDir });
    await rm(sourcePath);

    const result = await generateImageThumbnails({ publicDir, contentDir });

    assert.equal(result.skippedCount, 1);
    assert.equal(existsSync(outputPath), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("preview consumers use generated images without changing article heroes", () => {
  const card = read("src/components/Card.astro");
  const home = read("src/pages/index.astro");
  const about = read("src/pages/about.mdx");
  const map = read("src/features/about/components/AboutTravelMap.astro");
  const postDetails = read("src/layouts/PostDetails.astro");
  const packageJson = JSON.parse(read("package.json"));
  const gitignore = read(".gitignore");

  assert.match(card, /getImageThumbnailPath/);
  assert.match(card, /loading="lazy"/);
  assert.match(card, /decoding="async"/);
  assert.match(home, /getImageThumbnailPath/);
  assert.match(home, /loading=\{index === 0 \? "eager" : "lazy"\}/);
  assert.match(about, /getImageThumbnailPath/);
  assert.match(map, /getImageThumbnailPath/);
  assert.match(postDetails, /src=\{heroImage\}/);
  assert.doesNotMatch(postDetails, /getImageThumbnailPath/);
  assert.equal(typeof packageJson.scripts["generate:image-thumbnails"], "string");
  assert.match(packageJson.scripts.prebuild, /generate:image-thumbnails/);
  assert.match(packageJson.scripts["prebuild:check"], /generate:image-thumbnails/);
  assert.match(gitignore, /^public\/generated\/image-thumbnails\/$/m);
});
