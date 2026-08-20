import assert from "node:assert/strict";
import test from "node:test";

import {
  createAboutMapController,
  startAboutMap,
} from "../src/features/about/client/aboutMapController.js";
import { createAboutMapSession } from "../src/features/about/client/aboutMapSession.js";

class FakeElement extends EventTarget {
  constructor(dataset = {}) {
    super();
    this.dataset = { ...dataset };
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name),
    };
    this.clientHeight = 300;
    this.clientWidth = 300;
    this.scrollWidth = 600;
    this.scrollLeft = 0;
    this.scrollByCalls = [];
    this.scrollIntoViewCalls = [];
  }

  hasClass(name) {
    return this.classList.has(name);
  }

  scrollBy(options) {
    this.scrollByCalls.push(options);
    this.scrollLeft += options.left;
  }

  scrollIntoView(options) {
    this.scrollIntoViewCalls.push(options);
  }
}

class FakeButton extends FakeElement {
  constructor(dataset) {
    super(dataset);
    this.disabled = false;
  }
}

class FakeRoot extends FakeElement {
  constructor(places) {
    super({ places: JSON.stringify(places) });
    this.mapElement = new FakeElement();
    this.filterButtons = [
      new FakeButton({ filter: "all" }),
      new FakeButton({ filter: "work" }),
      new FakeButton({ filter: "travel" }),
    ];
    this.cardButtons = places.map(
      (place) => new FakeButton({ placeId: place.id, placeType: place.type })
    );
    this.cardsViewport = new FakeElement();
    this.cardsPrev = new FakeButton();
    this.cardsNext = new FakeButton();
  }

  querySelector(selector) {
    if (selector === "[data-map-canvas]") return this.mapElement;
    if (selector === "[data-cards-viewport]") return this.cardsViewport;
    if (selector === "[data-cards-prev]") return this.cardsPrev;
    if (selector === "[data-cards-next]") return this.cardsNext;
    const placeMatch = selector.match(/^\[data-place-id="(.+)"\]$/);
    if (placeMatch)
      return this.cardButtons.find((card) => card.dataset.placeId === placeMatch[1]) ?? null;
    return null;
  }

  querySelectorAll(selector) {
    if (selector === "[data-filter]") return this.filterButtons;
    if (selector === "[data-place-id]") return this.cardButtons;
    return [];
  }
}

class FakeDocument extends EventTarget {
  constructor(root) {
    super();
    this.readyState = "complete";
    this.roots = [root];
  }

  querySelectorAll(selector) {
    return selector === "[data-about-map-root]" ? this.roots : [];
  }
}

class FakeWindow extends EventTarget {
  constructor() {
    super();
    this.innerWidth = 1024;
  }
}

class FakeMap {
  constructor() {
    this.layers = new Set();
    this.fitBoundsCalls = [];
    this.invalidatedSizes = 0;
    this.removed = false;
    this.zoom = 4;
    this.centerDistance = 0;
    this.events = new Map();
  }

  setView() {
    return this;
  }

  addLayer(layer) {
    this.layers.add(layer);
    return this;
  }

  removeLayer(layer) {
    this.layers.delete(layer);
    return this;
  }

  hasLayer(layer) {
    return this.layers.has(layer);
  }

  fitBounds(positions, options) {
    this.fitBoundsCalls.push({ positions, options });
  }

  getZoom() {
    return this.zoom;
  }

  getCenter() {
    return { distanceTo: () => this.centerDistance };
  }

  project() {
    return { subtract: () => ({ lat: 0, lng: 0, distanceTo: () => 0 }) };
  }

  unproject(center) {
    return center;
  }

  stop() {}

  closePopup() {}

  flyTo() {
    return this;
  }

  invalidateSize() {
    this.invalidatedSizes += 1;
  }

  once(event, callback) {
    this.events.set(event, callback);
  }

  off(event, callback) {
    if (this.events.get(event) === callback) this.events.delete(event);
  }

  remove() {
    this.removed = true;
  }
}

class FakeMarker {
  constructor(map, coordinates, options) {
    this.map = map;
    this.coordinates = coordinates;
    this.options = options;
    this.popup = null;
    this.icon = options.icon;
    this.openedPopups = 0;
    this.events = new Map();
  }

  bindPopup(markup, options) {
    this.popup = { markup, options };
    return this;
  }

  addTo(map) {
    map.addLayer(this);
    return this;
  }

  on(event, callback) {
    this.events.set(event, callback);
    return this;
  }

  emit(event) {
    this.events.get(event)?.();
  }

  setIcon(icon) {
    this.icon = icon;
    return this;
  }

  getPopup() {
    return this.popup;
  }

  openPopup() {
    this.openedPopups += 1;
  }
}

function createLeafletDouble() {
  const state = { maps: [], markers: [] };
  const leaflet = {
    state,
    map() {
      const map = new FakeMap();
      state.maps.push(map);
      return map;
    },
    control: {
      zoom: () => ({ addTo: () => undefined }),
    },
    tileLayer: () => ({ addTo: () => undefined }),
    marker(coordinates, options) {
      const marker = new FakeMarker(state.maps.at(-1), coordinates, options);
      state.markers.push(marker);
      return marker;
    },
    divIcon(options) {
      return options;
    },
    point(valueX, valueY) {
      return { x: valueX, y: valueY };
    },
    latLngBounds(positions) {
      return positions;
    },
  };
  return leaflet;
}

function createTimers() {
  const timers = new Map();
  let nextId = 1;
  return {
    timers,
    setTimeoutFn(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeoutFn(id) {
      timers.delete(id);
    },
  };
}

function createHarness() {
  const places = [
    {
      id: "work-place",
      type: "work",
      lat: 48,
      lng: 2,
      image: "/work.jpg",
      title: "Work",
      location: "Paris",
    },
    {
      id: "travel-place",
      type: "travel",
      lat: 28,
      lng: 77,
      image: "/travel.jpg",
      title: "Travel",
      location: "Delhi",
    },
  ];
  const root = new FakeRoot(places);
  const documentRef = new FakeDocument(root);
  const windowRef = new FakeWindow();
  const timers = createTimers();
  const leaflet = createLeafletDouble();
  const controller = createAboutMapController({
    leaflet,
    documentRef,
    windowRef,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
    consoleRef: { error: () => undefined },
  });
  return { controller, documentRef, leaflet, root, timers, windowRef };
}

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
