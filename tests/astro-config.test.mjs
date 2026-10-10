import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

test("astro config prebundles leaflet for the about map", () => {
  const source = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");

  assert.match(source, /optimizeDeps:\s*\{[\s\S]*include:\s*\[\s*"leaflet"\s*\]/);
});

test("PWA precaches lightweight assets and caches images at runtime", () => {
  const source = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");
  const globPatterns = source.match(/globPatterns:\s*\[[^\]]+\]/)?.[0];

  assert.ok(globPatterns, "PWA glob patterns should be configured");
  assert.doesNotMatch(globPatterns, /png|jpe?g|gif|webp|svg/);
  assert.match(source, /urlPattern:\s*\/\\\.\(\?:png\|jpg\|jpeg\|svg\|gif\|webp\)/);
});

test("PWA manifest icons are square PNGs at their declared sizes", async () => {
  const source = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");
  const iconList = source.match(/icons:\s*\[([^\]]*)\]/)?.[1] ?? "";
  const icons = [...iconList.matchAll(/\{([^}]*)\}/g)].map(([, entry]) => {
    const field = (name) => entry.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1];
    return {
      src: field("src"),
      sizes: field("sizes"),
      type: field("type"),
      purpose: field("purpose"),
    };
  });

  assert.ok(icons.length > 0, "manifest should declare icons");
  assert.ok(
    icons.some(({ sizes }) => sizes === "192x192"),
    "manifest should declare a 192px icon"
  );
  assert.ok(
    icons.some(({ sizes }) => sizes === "512x512"),
    "manifest should declare a 512px icon"
  );

  for (const { src, sizes, type, purpose } of icons) {
    assert.match(sizes ?? "", /^(\d+)x\1$/, `${src} should declare a square size`);
    assert.equal(type, "image/png", `${src} should be declared as image/png`);
    assert.doesNotMatch(purpose ?? "", /maskable/, `${src} has no safe zone for maskable`);

    const [width, height] = sizes.split("x").map(Number);
    const metadata = await sharp(
      fileURLToPath(new URL(`../public/${src}`, import.meta.url))
    ).metadata();
    assert.equal(metadata.format, "png", `${src} should be a PNG file`);
    assert.equal(metadata.width, width, `${src} width should match its declared size`);
    assert.equal(metadata.height, height, `${src} height should match its declared size`);
  }
});

test("remark-collapse configuration uses a typed plugin without compiler suppressions", () => {
  const config = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");
  const declarations = readFileSync(new URL("../src/types.d.ts", import.meta.url), "utf8");

  assert.doesNotMatch(config, /@ts-(?:expect-error|ignore|nocheck)/);
  assert.match(
    declarations,
    /remarkCollapse:\s*import\("unified"\)\.Plugin<\[CollapseOptions\],\s*import\("mdast"\)\.Root>/
  );
});

test("sitemap priority config has no post-year buckets", () => {
  const source = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\/posts\/20\d/);
  assert.doesNotMatch(source, /Recent blog posts \(2024-2025\)/);
});
