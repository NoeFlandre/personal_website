import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/features/about/components/AboutTravelMap.astro", import.meta.url),
  "utf8"
);
const controllerSource = readFileSync(
  new URL("../src/features/about/client/aboutMapController.js", import.meta.url),
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

test("AboutTravelMap releases browser resources before Astro swaps pages", () => {
  assert.match(controllerSource, /let lifecycleController = new AbortController\(\)/);
  assert.match(
    controllerSource,
    /signal\.addEventListener\("abort", removeMap, \{ once: true \}\)/
  );
  assert.match(
    controllerSource,
    /windowRef\?\.addEventListener\("resize", updateCardsNav, \{ signal \}\)/
  );
  assert.match(controllerSource, /documentRef\.addEventListener\("astro:before-swap", cleanup\)/);
  assert.match(
    controllerSource,
    /signal\.addEventListener\("abort", \(\) => clearTimeoutFn\(timeoutId\), \{ once: true \}\)/
  );
  assert.equal(
    controllerSource.match(/\bsetTimeoutFn\(/g)?.length,
    1,
    "only the abort-aware scheduler may call the injected timer"
  );
});
