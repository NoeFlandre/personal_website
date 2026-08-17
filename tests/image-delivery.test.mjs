import assert from "node:assert/strict";
import { readFileSync as readFile } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
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
