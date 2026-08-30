import assert from "node:assert/strict";
import test from "node:test";

import {
  createAboutMapController,
  getAboutMapRoots,
  startAboutMap,
} from "../src/features/about/client/aboutMapController.js";
import { createAboutMapSession } from "../src/features/about/client/aboutMapSession.js";
import { createAboutMapFixture, createLeafletDouble } from "./helpers/about-map-fixtures.mjs";

function createHarness() {
  const fixture = createAboutMapFixture();
  const controller = createAboutMapController({
    leaflet: fixture.leaflet,
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    setTimeoutFn: fixture.timers.setTimeoutFn,
    clearTimeoutFn: fixture.timers.clearTimeoutFn,
    consoleRef: { error: () => undefined },
  });
  return { controller, ...fixture };
}

test("About-map root discovery returns every root and handles a missing document", () => {
  const { documentRef, root } = createHarness();
  const secondRoot = {};
  documentRef.roots.push(secondRoot);

  assert.deepEqual(getAboutMapRoots(documentRef), [root, secondRoot]);
  assert.deepEqual(getAboutMapRoots(null), []);
});

test("controller mounts the map and applies a selected place-type filter", () => {
  const { controller, leaflet, root } = createHarness();

  controller.start();

  assert.equal(root.dataset.mapInitState, "ready");
  assert.equal(root.dataset.mapRetryCount, "0");
  assert.equal(leaflet.state.maps.length, 1);
  assert.equal(leaflet.state.markers.length, 2);
  assert.equal(
    root.cardButtons.every((card) => card.dataset.hidden === "false"),
    true
  );

  root.filterButtons[1].dispatchEvent(new Event("click"));

  assert.equal(root.filterButtons[1].dataset.active, "true");
  assert.equal(root.cardButtons[0].dataset.hidden, "false");
  assert.equal(root.cardButtons[1].dataset.hidden, "true");
  assert.equal(leaflet.state.maps[0].layers.has(leaflet.state.markers[0]), true);
  assert.equal(leaflet.state.maps[0].layers.has(leaflet.state.markers[1]), false);
});

test("controller requires Leaflet and safely handles missing documents", () => {
  assert.throws(
    () => createAboutMapController({ leaflet: null }),
    (error) =>
      error instanceof TypeError &&
      error.message === "The About map controller requires a Leaflet adapter"
  );

  const controller = createAboutMapController({
    leaflet: createLeafletDouble(),
    documentRef: null,
  });
  assert.doesNotThrow(() => {
    controller.start();
    controller.setup();
    controller.setupWithRetry();
  });

  const withNullRoot = createHarness();
  withNullRoot.documentRef.roots = [null];
  assert.doesNotThrow(() => withNullRoot.controller.setup());
});

test("controller keeps loading and ready roots idempotent and reports unmountable roots", () => {
  const { controller, root, leaflet } = createHarness();

  root.dataset.mapInitState = "loading";
  controller.setupWithRetry();
  assert.equal(leaflet.state.maps.length, 0);

  root.dataset.mapInitState = "ready";
  controller.setupWithRetry();
  assert.equal(leaflet.state.maps.length, 0);

  root.dataset.mapInitState = "idle";
  root.mapElement = null;
  controller.setupWithRetry();
  assert.equal(root.dataset.mapInitState, "idle");
  assert.equal(leaflet.state.maps.length, 0);
});

test("controller retries failed mounts, clears retry timers, and runs the retry callback", () => {
  const harness = createHarness();
  const errors = [];
  const controller = createAboutMapController({
    leaflet: harness.leaflet,
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    setTimeoutFn: harness.timers.setTimeoutFn,
    clearTimeoutFn: harness.timers.clearTimeoutFn,
    consoleRef: { error: (...args) => errors.push(args) },
  });

  harness.root.querySelector = () => {
    throw new Error("mount failed");
  };
  controller.start();

  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], "Failed to initialize About map demo");
  assert.equal(errors[0][1] instanceof Error, true);
  assert.equal(harness.root.dataset.mapInitState, "loading");
  assert.equal(harness.root.dataset.mapRetryCount, "1");
  assert.deepEqual(
    [...harness.timers.timers.values()].map(({ delay }) => delay),
    [600]
  );

  delete harness.root.querySelector;
  assert.equal(harness.timers.timers.size, 1);
  [...harness.timers.timers.values()][0].callback();
  assert.equal(harness.root.dataset.mapInitState, "ready");
  assert.equal(harness.leaflet.state.maps.length, 1);

  controller.cleanup();
  assert.equal(harness.timers.timers.size, 0);

  const exhausted = createHarness();
  exhausted.root.dataset.mapRetryCount = "3";
  exhausted.root.querySelector = () => {
    throw new Error("mount failed");
  };
  const exhaustedController = createAboutMapController({
    leaflet: exhausted.leaflet,
    documentRef: exhausted.documentRef,
    windowRef: exhausted.windowRef,
    setTimeoutFn: exhausted.timers.setTimeoutFn,
    clearTimeoutFn: exhausted.timers.clearTimeoutFn,
    consoleRef: {},
  });
  exhaustedController.start();
  assert.equal(exhausted.timers.timers.size, 0);
});

test("controller tolerates missing console error methods", () => {
  const harness = createHarness();
  harness.root.querySelector = () => {
    throw new Error("mount failed");
  };
  const controller = createAboutMapController({
    leaflet: harness.leaflet,
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    setTimeoutFn: harness.timers.setTimeoutFn,
    clearTimeoutFn: harness.timers.clearTimeoutFn,
    consoleRef: null,
  });

  assert.doesNotThrow(() => controller.start());
  controller.cleanup();
});

test("controller refreshes lifecycle state after cleanup and preserves start idempotence", () => {
  const harness = createHarness();
  harness.controller.start();
  harness.controller.cleanup();

  harness.root.dataset.mapInitState = "idle";
  harness.controller.setup();
  assert.equal(harness.leaflet.state.maps.length, 2);
  harness.root.filterButtons[1].dispatchEvent(new Event("click"));
  assert.equal(harness.root.filterButtons[1].dataset.active, "true");
  harness.controller.cleanup();

  harness.root.dataset.mapInitState = "idle";
  harness.controller.start();
  assert.equal(harness.leaflet.state.maps.length, 2);

  harness.root.dataset.mapInitState = "idle";
  harness.controller.start();
  assert.equal(harness.leaflet.state.maps.length, 2);
});

test("controller binds loading and page lifecycle events once", () => {
  const harness = createHarness();
  harness.documentRef.readyState = "loading";
  harness.controller.start();
  assert.equal(harness.leaflet.state.maps.length, 0);

  harness.documentRef.dispatchEvent(new Event("DOMContentLoaded"));
  assert.equal(harness.leaflet.state.maps.length, 1);
  harness.controller.cleanup();

  harness.root.dataset.mapInitState = "idle";
  harness.documentRef.dispatchEvent(new Event("DOMContentLoaded"));
  assert.equal(harness.leaflet.state.maps.length, 1);

  harness.root.dataset.mapInitState = "idle";
  harness.documentRef.dispatchEvent(new Event("astro:after-swap"));
  assert.equal(harness.leaflet.state.maps.length, 2);
  harness.controller.cleanup();

  harness.root.dataset.mapInitState = "idle";
  harness.documentRef.dispatchEvent(new Event("astro:page-load"));
  assert.equal(harness.leaflet.state.maps.length, 3);
  harness.controller.cleanup();
});

test("startAboutMap starts a controller and returns its cleanup function", () => {
  const harness = createHarness();
  const cleanup = startAboutMap(harness.leaflet, {
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    setTimeoutFn: harness.timers.setTimeoutFn,
    clearTimeoutFn: harness.timers.clearTimeoutFn,
    consoleRef: { error: () => undefined },
  });

  assert.equal(typeof cleanup, "function");
  assert.equal(harness.leaflet.state.maps.length, 1);
  cleanup();
  assert.equal(harness.leaflet.state.maps[0].removed, true);
});

test("controller keeps marker and card selection synchronized", () => {
  const { controller, leaflet, root } = createHarness();

  controller.start();
  leaflet.state.markers[0].emit("click");

  assert.equal(root.cardButtons[0].dataset.active, "true");
  assert.match(leaflet.state.markers[0].icon.html, /is-selected/);

  root.cardButtons[1].dispatchEvent(new Event("click"));

  assert.equal(root.cardButtons[1].dataset.active, "true");
  assert.equal(leaflet.state.markers[1].openedPopups, 1);
});

test("card navigation tracks overflow and scrolls one viewport at a time", () => {
  const { controller, root, windowRef } = createHarness();

  controller.start();

  assert.equal(root.dataset.cardsScrollable, "true");
  assert.equal(root.cardsPrev.disabled, true);
  assert.equal(root.cardsNext.disabled, false);

  root.cardsNext.dispatchEvent(new Event("click"));
  assert.deepEqual(root.cardsViewport.scrollByCalls.at(-1), {
    left: root.cardsViewport.clientWidth,
    behavior: "smooth",
  });

  root.cardsViewport.scrollLeft = root.cardsViewport.scrollWidth - root.cardsViewport.clientWidth;
  root.cardsViewport.dispatchEvent(new Event("scroll"));
  assert.equal(root.cardsPrev.disabled, false);
  assert.equal(root.cardsNext.disabled, true);

  windowRef.dispatchEvent(new Event("resize"));
  assert.equal(root.dataset.cardsScrollable, "true");
});

test("card selection opens a popup after a moving map finishes", () => {
  const { controller, leaflet, root, timers, windowRef } = createHarness();
  windowRef.innerWidth = 390;
  root.mapElement.clientHeight = 220;

  controller.start();
  const map = leaflet.state.maps[0];
  map.zoom = 2;
  map.centerDistance = 100;

  root.cardButtons[1].dispatchEvent(new Event("click"));

  assert.equal(map.events.has("moveend"), true);
  assert.equal(
    timers.timers.has([...timers.timers.keys()].find((id) => timers.timers.get(id).delay === 900)),
    true
  );

  map.events.get("moveend")();

  assert.equal(leaflet.state.markers[1].openedPopups, 1);
  assert.equal(
    [...timers.timers.values()].some(({ delay }) => delay === 900),
    false
  );
});

test("controller removes the map and pending work on Astro page swaps", () => {
  const { controller, documentRef, leaflet, timers } = createHarness();

  controller.start();
  assert.equal(timers.timers.size, 2);

  documentRef.dispatchEvent(new Event("astro:before-swap"));

  assert.equal(leaflet.state.maps[0].removed, true);
  assert.equal(timers.timers.size, 0);
});

test("map session mounts and cleans up its Leaflet runtime", () => {
  const { leaflet, root, timers, windowRef } = createHarness();
  const session = createAboutMapSession({
    leaflet,
    windowRef,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const lifecycleController = new AbortController();

  assert.equal(session.mount(root, lifecycleController.signal), true);
  assert.equal(leaflet.state.maps.length, 1);
  assert.equal(timers.timers.size, 2);

  lifecycleController.abort();

  assert.equal(leaflet.state.maps[0].removed, true);
  assert.equal(timers.timers.size, 0);
});
