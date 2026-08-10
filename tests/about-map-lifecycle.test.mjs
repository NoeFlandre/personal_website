import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/features/about/components/AboutTravelMap.astro", import.meta.url),
  "utf8"
);

test("AboutTravelMap stays compiler checked without blanket suppressions", () => {
  assert.doesNotMatch(source, /@ts-(?:expect-error|ignore|nocheck)/);
});

test("AboutTravelMap releases browser resources before Astro swaps pages", () => {
  assert.match(source, /let lifecycleController = new AbortController\(\)/);
  assert.match(source, /signal\.addEventListener\("abort", removeMap, \{ once: true \}\)/);
  assert.match(source, /window\.addEventListener\("resize", updateCardsNav, \{ signal \}\)/);
  assert.match(
    source,
    /document\.addEventListener\("astro:before-swap", \(\) => \{\s*lifecycleController\.abort\(\)/
  );
  assert.match(
    source,
    /signal\.addEventListener\("abort", \(\) => clearTimeout\(timeoutId\), \{ once: true \}\)/
  );
  assert.equal(
    source.match(/\bsetTimeout\(/g)?.length,
    1,
    "only the abort-aware scheduler may call setTimeout"
  );
});
