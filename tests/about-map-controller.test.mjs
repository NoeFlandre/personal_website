import assert from "node:assert/strict";
import test from "node:test";

import { createAboutMapController } from "../src/features/about/client/aboutMapController.js";
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
    return { distanceTo: () => 0 };
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
