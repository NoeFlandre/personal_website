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

test("AboutTravelMap delegates client behavior to a deep controller module", () => {
  assert.match(source, /import \{ startAboutMap \} from "\.\.\/client\/aboutMapController\.js"/);
  assert.match(source, /startAboutMap\(L\)/);
  assert.doesNotMatch(source, /let lifecycleController = new AbortController\(\)/);
});
