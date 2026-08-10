import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("remark-collapse configuration uses a typed plugin without compiler suppressions", () => {
  const config = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");
  const declarations = readFileSync(new URL("../src/types.d.ts", import.meta.url), "utf8");

  assert.doesNotMatch(config, /@ts-(?:expect-error|ignore|nocheck)/);
  assert.match(
    declarations,
    /remarkCollapse:\s*import\("unified"\)\.Plugin<\[CollapseOptions\],\s*import\("mdast"\)\.Root>/
  );
});
