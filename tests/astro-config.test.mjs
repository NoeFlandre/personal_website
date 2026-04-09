import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("astro config prebundles leaflet for the about map", () => {
  const source = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");

  assert.match(source, /optimizeDeps:\s*\{[\s\S]*include:\s*\[\s*"leaflet"\s*\]/);
});
