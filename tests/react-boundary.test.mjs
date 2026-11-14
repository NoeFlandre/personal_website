import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { readRepoFile } from "./helpers/repo-files.mjs";

test("the Astro site stays free of dormant React infrastructure", () => {
  const packageJson = JSON.parse(readRepoFile("package.json"));
  const astroConfig = readRepoFile("astro.config.mjs");

  for (const dependency of ["@astrojs/react", "react", "react-dom"]) {
    assert.equal(packageJson.dependencies?.[dependency], undefined);
  }

  assert.doesNotMatch(astroConfig, /@astrojs\/react/);
  assert.doesNotMatch(astroConfig, /\breact\(\)/);
  assert.equal(existsSync(new URL("../src/components/ui/mobile-menu.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/components/ui/separator.tsx", import.meta.url)), false);
});
