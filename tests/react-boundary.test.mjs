import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the Astro site stays free of dormant React infrastructure", () => {
  const packageJson = JSON.parse(read("package.json"));
  const astroConfig = read("astro.config.mjs");

  for (const dependency of ["@astrojs/react", "react", "react-dom"]) {
    assert.equal(packageJson.dependencies?.[dependency], undefined);
  }

  assert.doesNotMatch(astroConfig, /@astrojs\/react/);
  assert.doesNotMatch(astroConfig, /\breact\(\)/);
  assert.equal(existsSync(new URL("../src/components/ui/mobile-menu.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/components/ui/separator.tsx", import.meta.url)), false);
});
