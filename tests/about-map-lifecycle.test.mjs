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
const sessionSource = readFileSync(
  new URL("../src/features/about/client/aboutMapSession.js", import.meta.url),
  "utf8"
);
const clientLifecycleSource = readFileSync(
  new URL("../src/utils/clientLifecycle.js", import.meta.url),
  "utf8"
);
const interactionCoordinatorSource = readFileSync(
  new URL("../src/features/about/client/aboutMapInteractionCoordinator.js", import.meta.url),
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

test("About map initialization keeps its major responsibilities in internal helpers", () => {
  assert.match(sessionSource, /function bindCardsNavigation\(/);
  assert.match(sessionSource, /from "\.\/aboutMapInteractionCoordinator\.js"/);
  assert.match(interactionCoordinatorSource, /function createMapInteractionCoordinator\(/);
  assert.match(interactionCoordinatorSource, /function createMapRuntime\(/);
  assert.match(controllerSource, /createAboutMapSession\(/);
});

test("AboutTravelMap releases browser resources before Astro swaps pages", () => {
  assert.match(controllerSource, /let lifecycleController = new AbortController\(\)/);
  assert.match(sessionSource, /signal\.addEventListener\("abort", removeMap\)/);
  assert.match(
    sessionSource,
    /windowRef\?\.addEventListener\("resize", updateCardsNav, \{ signal \}\)/
  );
  assert.match(controllerSource, /documentRef\.addEventListener\("astro:before-swap", cleanup\)/);
  assert.match(controllerSource, /scheduleAbortableTimeout\(\{/);
  assert.equal(
    sessionSource.match(/\bscheduleAbortableTimeout\(/g)?.length,
    1,
    "the map session delegates timer scheduling"
  );
  assert.equal(
    controllerSource.match(/\bscheduleAbortableTimeout\(/g)?.length,
    1,
    "the map controller delegates timer scheduling"
  );
  assert.match(
    clientLifecycleSource,
    /signal\.addEventListener\("abort", \(\) => clearTimeoutFn\(timeoutId\)\)/
  );
});
