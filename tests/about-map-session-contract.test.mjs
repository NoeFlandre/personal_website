import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPopupViewportOptions,
  bindCardsNavigation,
  canMountMap,
  createAboutMapSession,
  createMapRuntime,
  createMarkerIcon,
  createPopupMarkup,
  getCardSelection,
  getCardSelectionCenter,
  getCardSelectionOffset,
  getMapMountElements,
  getMarkerOffsets,
  getPopupMaxWidth,
  getPopupPanPadding,
  hasCardsNavigationElements,
  highlightMapSelection,
  initializeLeafletMap,
  moveMapToSelection,
  openPopupFromCardSelection,
  removeActiveMap,
  resetLeafletContainer,
  shouldMoveMap,
  updateCardsNavState,
  updateMapVisibility,
} from "../src/features/about/client/aboutMapSession.js";
import { createAboutMapFixture } from "./helpers/about-map-fixtures.mjs";

function createRoot() {
  return { dataset: {} };
}

function createViewport({ clientWidth = 100, scrollWidth = 100, scrollLeft = 0 } = {}) {
  return Object.assign(new EventTarget(), {
    clientWidth,
    scrollWidth,
    scrollLeft,
    scrollByCalls: [],
    scrollBy(options) {
      this.scrollByCalls.push(options);
    },
  });
}

test("card navigation requires every element and handles both scroll boundaries", () => {
  const viewport = createViewport({ clientWidth: 100, scrollWidth: 110, scrollLeft: 0 });
  const previous = { disabled: false };
  const next = { disabled: false };
  const root = createRoot();

  assert.equal(hasCardsNavigationElements(viewport, previous, next), true);
  assert.equal(hasCardsNavigationElements(null, previous, next), false);
  assert.equal(hasCardsNavigationElements(viewport, null, next), false);
  assert.equal(hasCardsNavigationElements(viewport, previous, null), false);

  updateCardsNavState(root, viewport, previous, next);
  assert.equal(root.dataset.cardsScrollable, "true");
  assert.equal(previous.disabled, true);
  assert.equal(next.disabled, false);

  viewport.scrollLeft = 2;
  updateCardsNavState(root, viewport, previous, next);
  assert.equal(previous.disabled, true);

  viewport.scrollLeft = 8;
  updateCardsNavState(root, viewport, previous, next);
  assert.equal(previous.disabled, false);
  assert.equal(next.disabled, true);

  viewport.scrollWidth = 102;
  viewport.scrollLeft = 0;
  updateCardsNavState(root, viewport, previous, next);
  assert.equal(root.dataset.cardsScrollable, "false");
  assert.equal(previous.disabled, true);
  assert.equal(next.disabled, true);

  const unchangedRoot = createRoot();
  updateCardsNavState(unchangedRoot, null, previous, next);
  assert.deepEqual(unchangedRoot.dataset, {});
});

test("card navigation binds each control once and removes optional listeners on abort", () => {
  const root = createRoot();
  const viewport = createViewport({ clientWidth: 120, scrollWidth: 360 });
  const previous = new EventTarget();
  const next = new EventTarget();
  previous.disabled = false;
  next.disabled = false;
  const windowRef = new EventTarget();
  const windowListenerCalls = [];
  const nativeWindowAddEventListener = windowRef.addEventListener.bind(windowRef);
  windowRef.addEventListener = (type, listener, options) => {
    windowListenerCalls.push({ type, options });
    return nativeWindowAddEventListener(type, listener, options);
  };
  const signalController = new AbortController();

  bindCardsNavigation({
    root,
    cardsViewport: viewport,
    cardsPrev: previous,
    cardsNext: next,
    signal: signalController.signal,
    windowRef,
  });
  assert.equal(windowListenerCalls[0].type, "resize");
  assert.equal(windowListenerCalls[0].options.signal, signalController.signal);
  bindCardsNavigation({
    root,
    cardsViewport: viewport,
    cardsPrev: previous,
    cardsNext: next,
    signal: signalController.signal,
    windowRef,
  });

  previous.dispatchEvent(new Event("click"));
  next.dispatchEvent(new Event("click"));
  assert.deepEqual(viewport.scrollByCalls, [
    { left: -120, behavior: "smooth" },
    { left: 120, behavior: "smooth" },
  ]);

  viewport.scrollLeft = 120;
  viewport.dispatchEvent(new Event("scroll"));
  assert.equal(root.dataset.cardsScrollable, "true");
  windowRef.dispatchEvent(new Event("resize"));

  signalController.abort();
  viewport.scrollLeft = 0;
  previous.dispatchEvent(new Event("click"));
  next.dispatchEvent(new Event("click"));
  viewport.dispatchEvent(new Event("scroll"));
  windowRef.dispatchEvent(new Event("resize"));
  assert.equal(viewport.scrollByCalls.length, 2);
  assert.equal(previous.disabled, false);

  assert.doesNotThrow(() =>
    bindCardsNavigation({
      root: createRoot(),
      cardsViewport: null,
      cardsPrev: null,
      cardsNext: null,
      signal: new AbortController().signal,
      windowRef: null,
    })
  );

  const noViewportRoot = createRoot();
  const noViewportPrevious = new EventTarget();
  assert.doesNotThrow(() => {
    bindCardsNavigation({
      root: noViewportRoot,
      cardsViewport: null,
      cardsPrev: noViewportPrevious,
      cardsNext: null,
      signal: new AbortController().signal,
      windowRef: null,
    });
    noViewportPrevious.dispatchEvent(new Event("click"));
  });
});

test("card selection offsets cover mobile and desktop bounds", () => {
  assert.deepEqual(
    [
      getCardSelectionOffset(0, true),
      getCardSelectionOffset(500, true),
      getCardSelectionOffset(300, true),
      getCardSelectionOffset(0, false),
      getCardSelectionOffset(1000, false),
      getCardSelectionOffset(400, false),
    ],
    [72, 120, 72, 56, 96, 72]
  );
});

test("card selection center projects the place with mobile and desktop offsets", () => {
  const calls = [];
  const map = {
    project(position, zoom) {
      calls.push({ method: "project", position, zoom });
      return {
        subtract(offset) {
          calls.push({ method: "subtract", offset });
          return "projected-center";
        },
      };
    },
    unproject(value, zoom) {
      calls.push({ method: "unproject", value, zoom });
      return "geographic-center";
    },
  };
  const place = { lat: 48, lng: 2 };

  assert.equal(
    getCardSelectionCenter(map, { clientHeight: 300 }, { innerWidth: 520 }, place, 4),
    "geographic-center"
  );
  assert.equal(calls[1].offset[1], 72);
  assert.deepEqual(calls[0].position, [48, 2]);
  assert.equal(calls[0].zoom, 4);

  calls.length = 0;
  getCardSelectionCenter(map, { clientHeight: 300 }, { innerWidth: 521 }, place, 5);
  assert.equal(calls[1].offset[1], 56);

  calls.length = 0;
  getCardSelectionCenter(map, { clientHeight: 0 }, null, place, 6);
  assert.equal(calls[1].offset[1], 56);
});

test("card selection rejects missing, hidden, unknown, and unmarked cards", () => {
  const places = [{ id: "one", type: "work" }];
  const marker = { id: "marker" };
  const markers = new Map([["one", marker]]);

  assert.equal(getCardSelection({ dataset: {} }, places, markers), null);
  assert.equal(
    getCardSelection({ dataset: { placeId: "one", hidden: "true" } }, places, markers),
    null
  );
  assert.equal(getCardSelection({ dataset: { placeId: "missing" } }, places, markers), null);
  assert.equal(getCardSelection({ dataset: { placeId: "one" } }, places, new Map()), null);
  assert.deepEqual(
    getCardSelection({ dataset: { placeId: "one" } }, [{ id: "other" }, places[0]], markers),
    { marker, place: places[0], placeId: "one" }
  );
  assert.deepEqual(getCardSelection({ dataset: { placeId: "one" } }, places, markers), {
    marker,
    place: places[0],
    placeId: "one",
  });
});

test("map movement detects either zoom or center distance changes", () => {
  const map = {
    getZoom: () => 4,
    getCenter: () => ({ distanceTo: () => 18 }),
  };
  assert.equal(shouldMoveMap(map, {}, 4), false);
  assert.equal(
    shouldMoveMap({ getZoom: () => 0, getCenter: () => ({ distanceTo: () => 0 }) }, {}, 0.01),
    false
  );
  assert.equal(shouldMoveMap(map, {}, 4.02), true);
  assert.equal(
    shouldMoveMap({ getZoom: () => 4, getCenter: () => ({ distanceTo: () => 19 }) }, {}, 4),
    true
  );
});

test("moving to a card uses the configured animation and clears its fallback", () => {
  const events = new Map();
  const calls = [];
  const map = {
    stop: () => calls.push("stop"),
    closePopup: () => calls.push("closePopup"),
    once(name, callback) {
      events.set(name, callback);
    },
    off(name, callback) {
      calls.push({ method: "off", name, callback });
      events.delete(name);
    },
    flyTo(center, zoom, options) {
      calls.push({ method: "flyTo", center, zoom, options });
    },
  };
  let fallback;
  let clearCount = 0;
  let revealCount = 0;

  moveMapToSelection({
    map,
    targetCenter: "center",
    targetZoom: 5,
    revealPopup: () => revealCount++,
    clearTimeoutFn: () => clearCount++,
    scheduleTimeout: (callback, delay) => {
      fallback = { callback, delay };
      return 9;
    },
  });

  assert.deepEqual(calls.slice(0, 2), ["stop", "closePopup"]);
  assert.deepEqual(calls[2], {
    method: "flyTo",
    center: "center",
    zoom: 5,
    options: { duration: 0.72, easeLinearity: 0.25 },
  });
  assert.equal(fallback.delay, 900);
  events.get("moveend")();
  assert.equal(clearCount, 1);
  assert.equal(revealCount, 1);

  const secondEvents = new Map();
  const secondMap = {
    stop() {},
    closePopup() {},
    once(name, callback) {
      secondEvents.set(name, callback);
    },
    off(name, callback) {
      calls.push({ method: "off", name, callback });
    },
    flyTo() {},
  };
  let secondFallback;
  moveMapToSelection({
    map: secondMap,
    targetCenter: {},
    targetZoom: 2,
    revealPopup: () => revealCount++,
    clearTimeoutFn: () => clearCount++,
    scheduleTimeout: (callback) => {
      secondFallback = callback;
      return 0;
    },
  });
  secondFallback();
  assert.equal(revealCount, 2);
  assert.equal(calls.at(-1).name, "moveend");

  const noTimerEvents = new Map();
  const noTimerMap = {
    stop() {},
    closePopup() {},
    once(name, callback) {
      noTimerEvents.set(name, callback);
    },
    flyTo() {},
  };
  let noTimerClearCount = 0;
  moveMapToSelection({
    map: noTimerMap,
    targetCenter: {},
    targetZoom: 2,
    revealPopup: () => undefined,
    clearTimeoutFn: () => noTimerClearCount++,
    scheduleTimeout: () => 0,
  });
  noTimerEvents.get("moveend")();
  assert.equal(noTimerClearCount, 0);
});

test("mount prerequisites and Leaflet container reset are explicit", () => {
  const valid = {
    mapElement: {},
    filterButtons: [{}],
    cardButtons: [{}],
    mapPlaces: [{}],
  };
  assert.equal(canMountMap(valid), true);
  assert.equal(canMountMap({ ...valid, mapElement: null }), false);
  assert.equal(canMountMap({ ...valid, filterButtons: [] }), false);
  assert.equal(canMountMap({ ...valid, cardButtons: [] }), false);
  assert.equal(canMountMap({ ...valid, mapPlaces: [] }), false);

  const classes = new Set();
  const element = {
    innerHTML: "old",
    classList: {
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name),
    },
  };
  resetLeafletContainer(element);
  assert.equal(element.innerHTML, "old");
  classes.add("leaflet-container");
  resetLeafletContainer(element);
  assert.equal(element.innerHTML, "");
  assert.equal(classes.has("leaflet-container"), false);
});

test("active map cleanup is idempotent for mounted and empty sessions", () => {
  let removeCount = 0;
  const map = { remove: () => removeCount++ };
  assert.equal(removeActiveMap(null), null);
  assert.equal(removeActiveMap(map), null);
  assert.equal(removeCount, 1);
});

test("map mount element discovery parses every required root child", () => {
  const values = {
    map: {},
    viewport: {},
    previous: {},
    next: {},
    filters: [{}],
    cards: [{}],
  };
  const root = {
    dataset: { places: JSON.stringify([{ id: "one" }]) },
    querySelector(selector) {
      return (
        {
          "[data-map-canvas]": values.map,
          "[data-cards-viewport]": values.viewport,
          "[data-cards-prev]": values.previous,
          "[data-cards-next]": values.next,
        }[selector] ?? null
      );
    },
    querySelectorAll(selector) {
      return selector === "[data-filter]" ? values.filters : values.cards;
    },
  };
  assert.deepEqual(getMapMountElements(root), {
    cardButtons: values.cards,
    cardsNext: values.next,
    cardsPrev: values.previous,
    cardsViewport: values.viewport,
    filterButtons: values.filters,
    mapElement: values.map,
    mapPlaces: [{ id: "one" }],
  });
});

test("nearby map places receive deterministic visual offsets", () => {
  const offsets = getMarkerOffsets([
    { id: "first", lat: 44, lng: 4 },
    { id: "second", lat: 44.1, lng: 4.1 },
    { id: "remote", lat: 0, lng: 0 },
  ]);

  assert.deepEqual(offsets.get("first"), [-18, 0]);
  assert.deepEqual(offsets.get("second"), [18, 0]);
  assert.equal(offsets.has("remote"), false);
});

test("marker grouping uses transitive proximity and includes the exact boundary", () => {
  const chainedOffsets = getMarkerOffsets(
    [
      { id: "first", lat: 0, lng: 0 },
      { id: "second", lat: 0, lng: 1 },
      { id: "third", lat: 0, lng: 2 },
    ],
    1.1
  );
  assert.deepEqual(chainedOffsets.get("first"), [-36, 0]);
  assert.deepEqual(chainedOffsets.get("second"), [0, 0]);
  assert.deepEqual(chainedOffsets.get("third"), [36, 0]);

  const boundaryOffsets = getMarkerOffsets(
    [
      { id: "boundary-first", lat: 0, lng: 0 },
      { id: "boundary-second", lat: 0, lng: 1 },
    ],
    1
  );
  assert.deepEqual(boundaryOffsets.get("boundary-first"), [-18, 0]);
  assert.deepEqual(boundaryOffsets.get("boundary-second"), [18, 0]);
});

test("Leaflet initialization preserves map, controls, tile, and view options", () => {
  const calls = [];
  const map = {
    setView(center, zoom) {
      calls.push({ method: "setView", center, zoom });
      return this;
    },
  };
  const leaflet = {
    map(element, options) {
      calls.push({ method: "map", element, options });
      return map;
    },
    control: {
      zoom(options) {
        calls.push({ method: "zoom", options });
        return { addTo: (target) => calls.push({ method: "zoom.addTo", target }) };
      },
    },
    tileLayer(url, options) {
      calls.push({ method: "tileLayer", url, options });
      return { addTo: (target) => calls.push({ method: "tile.addTo", target }) };
    },
  };

  assert.equal(initializeLeafletMap(leaflet, "canvas"), map);
  assert.deepEqual(calls, [
    {
      method: "map",
      element: "canvas",
      options: { zoomControl: false, worldCopyJump: true },
    },
    { method: "setView", center: [23, 4], zoom: 2 },
    { method: "zoom", options: { position: "bottomright" } },
    { method: "zoom.addTo", target: map },
    {
      method: "tileLayer",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" },
    },
    { method: "tile.addTo", target: map },
  ]);
});

test("popup and marker presentation preserve responsive and place-specific details", () => {
  assert.equal(getPopupMaxWidth(null), 280);
  assert.equal(getPopupMaxWidth({ innerWidth: 100 }), 196);
  assert.equal(getPopupMaxWidth({ innerWidth: 1000 }), 280);
  assert.deepEqual(getPopupPanPadding({ point: (x, y) => [x, y] }, null), [22, 22]);
  assert.deepEqual(getPopupPanPadding({ point: (x, y) => [x, y] }, { innerWidth: 520 }), [14, 14]);
  assert.deepEqual(getPopupPanPadding({ point: (x, y) => [x, y] }, { innerWidth: 521 }), [22, 22]);

  const iconCalls = [];
  const icon = createMarkerIcon(
    {
      divIcon: (options) => {
        iconCalls.push(options);
        return options;
      },
    },
    "travel",
    true
  );
  assert.equal(icon, iconCalls[0]);
  assert.deepEqual(icon, {
    className: "",
    html: '<span class="about-map-marker about-map-marker--travel is-selected"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -15],
  });
  assert.equal(
    createMarkerIcon({ divIcon: (options) => options }, "work").html,
    '<span class="about-map-marker about-map-marker--work"></span>'
  );
  assert.deepEqual(
    createMarkerIcon({ divIcon: (options) => options }, "work", false, [18, -4]).iconAnchor,
    [-6, 16]
  );

  const work = createPopupMarkup({
    image: "/work.jpg",
    title: "Work",
    type: "work",
    location: "Paris",
    period: "2020-2022",
    description: "Research",
    link: "https://example.com",
  });
  assert.match(work, /Worked/);
  assert.match(work, /2020-2022/);
  assert.match(work, /Research/);
  assert.match(work, /target="_blank" rel="noopener noreferrer"/);

  const travel = createPopupMarkup({
    image: "/travel.jpg",
    title: "Travel",
    type: "travel",
    location: "Delhi",
    period: "ignored",
    description: "ignored",
  });
  assert.equal(
    travel,
    `<div class="about-map-popup">
    <img src="/travel.jpg" alt="Photo placeholder for Travel" loading="lazy" />
    <div>
      <p class="about-map-popup__tag">Traveled</p>
      <h3>Travel</h3>
      <p>Delhi</p>
${" ".repeat(6)}
${" ".repeat(6)}
${" ".repeat(6)}
    </div>
  </div>`
  );
});

test("popup selection handles missing layers, missing popups, and viewport restoration", () => {
  const popup = {
    options: { autoPan: true, keepInView: true },
  };
  const marker = {
    getPopup: () => popup,
    openPopupCalls: 0,
    openPopup() {
      this.openPopupCalls += 1;
    },
  };
  const map = { hasLayer: () => true };
  let maxWidthCalls = 0;
  let paddingCalls = 0;
  const popupMaxWidth = () => {
    maxWidthCalls += 1;
    return 240;
  };
  const popupPanPadding = () => {
    paddingCalls += 1;
    return [14, 14];
  };

  applyPopupViewportOptions(popup, popupMaxWidth, popupPanPadding);
  assert.equal(popup.options.maxWidth, 240);
  assert.deepEqual(popup.options.autoPanPaddingTopLeft, [14, 14]);
  assert.deepEqual(popup.options.autoPanPaddingBottomRight, [14, 14]);
  assert.equal(maxWidthCalls, 1);
  assert.equal(paddingCalls, 2);
  applyPopupViewportOptions(null, popupMaxWidth, popupPanPadding);

  openPopupFromCardSelection({ map, marker, popupMaxWidth, popupPanPadding });
  assert.equal(marker.openPopupCalls, 1);
  assert.equal(popup.options.autoPan, true);
  assert.equal(popup.options.keepInView, true);

  const noPopupMarker = {
    getPopup: () => null,
    openPopupCalls: 0,
    openPopup() {
      this.openPopupCalls += 1;
    },
  };
  openPopupFromCardSelection({ map, marker: noPopupMarker, popupMaxWidth, popupPanPadding });
  assert.equal(noPopupMarker.openPopupCalls, 1);

  const absentMap = { hasLayer: () => false };
  openPopupFromCardSelection({ map: absentMap, marker, popupMaxWidth, popupPanPadding });
  assert.equal(marker.openPopupCalls, 1);
});

test("highlighting marks only the selected card and scrolls visible cards", () => {
  const iconCalls = [];
  const markers = new Map([
    ["one", { setIcon: (icon) => iconCalls.push({ id: "one", icon }) }],
    ["two", { setIcon: (icon) => iconCalls.push({ id: "two", icon }) }],
  ]);
  const unrelatedCard = {
    dataset: { placeId: "other", hidden: "false" },
    attributes: [],
    setAttribute(name, value) {
      this.attributes.push([name, value]);
    },
    scrollIntoView() {
      throw new Error("unrelated cards must not scroll");
    },
  };
  const visibleCard = {
    dataset: { placeId: "one", hidden: "false" },
    attributes: [],
    setAttribute(name, value) {
      this.attributes.push([name, value]);
    },
    scrollIntoView(options) {
      this.scrollOptions = options;
    },
  };
  const hiddenCard = {
    dataset: { placeId: "two", hidden: "true" },
    attributes: [],
    setAttribute(name, value) {
      this.attributes.push([name, value]);
    },
    scrollIntoView() {
      throw new Error("hidden cards must not scroll");
    },
  };
  const missingMarker = { id: "missing" };

  assert.equal(
    highlightMapSelection({
      placeId: "one",
      mapPlaces: [
        { id: "one", type: "work" },
        { id: "two", type: "travel" },
        { id: "missing", type: "study" },
      ],
      markersById: markers,
      cardButtons: [unrelatedCard, visibleCard, hiddenCard],
      markerIcon: (type, selected) => ({ type, selected }),
    }),
    "one"
  );
  assert.deepEqual(iconCalls, [
    { id: "one", icon: { type: "work", selected: true } },
    { id: "two", icon: { type: "travel", selected: false } },
  ]);
  assert.equal(visibleCard.dataset.active, "true");
  assert.equal(unrelatedCard.dataset.active, "false");
  assert.equal(hiddenCard.dataset.active, "false");
  assert.deepEqual(visibleCard.attributes, [["aria-pressed", "true"]]);
  assert.deepEqual(unrelatedCard.attributes, [["aria-pressed", "false"]]);
  assert.deepEqual(hiddenCard.attributes, [["aria-pressed", "false"]]);
  assert.deepEqual(visibleCard.scrollOptions, {
    behavior: "smooth",
    block: "nearest",
    inline: "nearest",
  });
  assert.equal(missingMarker.id, "missing");
  assert.doesNotThrow(() =>
    highlightMapSelection({
      placeId: "unknown",
      mapPlaces: [],
      markersById: new Map(),
      cardButtons: [unrelatedCard, visibleCard, hiddenCard],
      markerIcon: () => undefined,
    })
  );
  assert.doesNotThrow(() =>
    highlightMapSelection({
      placeId: "two",
      mapPlaces: [{ id: "two", type: "travel" }],
      markersById: new Map([["two", { setIcon() {} }]]),
      cardButtons: [hiddenCard],
      markerIcon: () => undefined,
    })
  );
});

test("visibility updates cards, layers, bounds, and selected-state invalidation", () => {
  const workCard = { dataset: { placeId: "work" } };
  const travelCard = { dataset: { placeId: "travel" } };
  const root = {
    querySelector(selector) {
      return selector.includes('"work"')
        ? workCard
        : selector.includes('"travel"')
          ? travelCard
          : null;
    },
  };
  const layers = [];
  const removed = [];
  const fitBoundsCalls = [];
  const map = {
    fitBounds(bounds, options) {
      fitBoundsCalls.push({ bounds, options });
    },
    removeLayer(marker) {
      removed.push(marker);
    },
  };
  const workMarker = {
    addTo(target) {
      layers.push({ marker: this, target });
    },
  };
  const travelMarker = {
    addTo(target) {
      layers.push({ marker: this, target });
    },
  };
  const cardsViewport = { scrollLeft: 99 };
  let updateCount = 0;
  const leaflet = {
    latLngBounds(positions) {
      return { positions };
    },
  };
  const places = [
    { id: "work", type: "work", title: "Work", lat: 48, lng: 2 },
    { id: "travel", type: "travel", title: "Travel", lat: 28, lng: 77 },
    { id: "unmarked", type: "study", lat: 1, lng: 2 },
  ];

  assert.equal(
    updateMapVisibility({
      activeFilter: "work",
      activePlaceId: "work",
      mapPlaces: places,
      markersById: new Map([
        ["work", workMarker],
        ["travel", travelMarker],
      ]),
      root,
      map,
      leaflet,
      cardsViewport,
      updateCardsNav: () => updateCount++,
    }),
    true
  );
  assert.equal(workCard.dataset.hidden, "false");
  assert.equal(travelCard.dataset.hidden, "true");
  assert.equal(cardsViewport.scrollLeft, 0);
  assert.equal(updateCount, 1);
  assert.deepEqual(layers, [{ marker: workMarker, target: map }]);
  assert.deepEqual(removed, [travelMarker]);
  assert.deepEqual(fitBoundsCalls, [
    { bounds: { positions: [[48, 2]] }, options: { padding: [42, 42], maxZoom: 4 } },
  ]);

  fitBoundsCalls.length = 0;
  cardsViewport.scrollLeft = 5;
  assert.equal(
    updateMapVisibility({
      activeFilter: "missing",
      activePlaceId: "work",
      mapPlaces: places,
      markersById: new Map([["work", workMarker]]),
      root,
      map,
      leaflet,
      cardsViewport: null,
      updateCardsNav: () => updateCount++,
    }),
    false
  );
  assert.deepEqual(fitBoundsCalls, []);

  assert.equal(
    updateMapVisibility({
      activeFilter: "all",
      activePlaceId: "travel",
      mapPlaces: places,
      markersById: new Map([
        ["work", workMarker],
        ["travel", travelMarker],
      ]),
      root,
      map,
      leaflet,
      cardsViewport: null,
      updateCardsNav: () => updateCount++,
    }),
    true
  );
  assert.equal(
    updateMapVisibility({
      activeFilter: "all",
      activePlaceId: "missing",
      mapPlaces: places,
      markersById: new Map([["work", workMarker]]),
      root,
      map,
      leaflet,
      cardsViewport: null,
      updateCardsNav: () => updateCount++,
    }),
    false
  );
});

test("map runtime wires markers, filters, card selection, popups, and delayed resize work", () => {
  const controller = new AbortController();
  const places = [
    { id: "work", type: "work", title: "Work", lat: 48, lng: 2 },
    { id: "travel", type: "travel", title: "Travel", lat: 28, lng: 77 },
  ];
  const fixture = createAboutMapFixture({
    places,
    filterValues: ["", "all", "work"],
    innerWidth: 520,
    createMap: true,
  });
  const {
    cardButtons: cards,
    cardsViewport: viewport,
    filterButtons: filters,
    leaflet,
    map: runtimeMap,
    mapElement,
    root,
  } = fixture;
  viewport.scrollLeft = 22;
  const markers = fixture.markers;
  const delayed = [];
  let updateCount = 0;

  createMapRuntime({
    leaflet,
    map: runtimeMap,
    mapElement,
    root,
    mapPlaces: places,
    filterButtons: filters,
    cardButtons: cards,
    cardsViewport: viewport,
    signal: controller.signal,
    windowRef: { innerWidth: 520 },
    clearTimeoutFn: () => undefined,
    scheduleTimeout: (callback, delay) => {
      delayed.push({ callback, delay });
      return delayed.length;
    },
    markerIcon: (type, selected = false) => ({ type, selected }),
    popupMarkup: (place) => `popup:${place.id}`,
    popupMaxWidth: () => 250,
    popupPanPadding: () => [22, 22],
    updateCardsNav: () => updateCount++,
  });

  assert.equal(markers.length, 2);
  assert.deepEqual(markers[0].coordinates, [48, 2]);
  assert.deepEqual(markers[0].markerOptions, {
    icon: { type: "work", selected: false },
    keyboard: false,
    riseOnHover: true,
  });
  assert.equal(markers[0].popup.markup, "popup:work");
  assert.deepEqual(markers[0].popup.options, {
    autoPan: true,
    keepInView: true,
    className: "about-map-leaflet-popup",
    maxWidth: 250,
    autoPanPaddingTopLeft: [22, 22],
    autoPanPaddingBottomRight: [22, 22],
  });
  assert.equal(runtimeMap.layers.size, 2);
  assert.deepEqual(runtimeMap.fitBoundsCalls[0], {
    bounds: {
      positions: [
        [48, 2],
        [28, 77],
      ],
    },
    options: { padding: [42, 42], maxZoom: 4 },
  });
  assert.equal(viewport.scrollLeft, 0);
  assert.equal(delayed.map(({ delay }) => delay).join(","), "80,400");
  delayed[0].callback();
  delayed[1].callback();
  assert.equal(runtimeMap.invalidated, 2);
  assert.equal(updateCount, 2);

  markers[0].eventHandlers.get("click")();
  assert.equal(cards[0].dataset.active, "true");
  assert.equal(cards[1].dataset.active, "false");
  assert.deepEqual(cards[0].scrollCalls.at(-1), {
    behavior: "smooth",
    block: "nearest",
    inline: "nearest",
  });
  markers[0].eventHandlers.get("popupopen")();
  cards[0].dataset.active = "false";
  markers[0].icon = { type: "work", selected: false };
  markers[0].eventHandlers.get("popupopen")();
  assert.equal(cards[0].dataset.active, "true");
  assert.equal(markers[0].icon.selected, true);

  cards[0].dispatchEvent(new Event("click"));
  assert.equal(markers[0].openPopupCount, 1);
  assert.deepEqual(runtimeMap.projectOffsets.at(-1), [0, 72]);
  assert.deepEqual(markers[0].openPopupSnapshots[0], { autoPan: false, keepInView: false });
  assert.equal(markers[0].popup.options.autoPan, true);
  assert.equal(markers[0].popup.options.keepInView, true);

  runtimeMap.getZoom = () => 2;
  cards[0].dispatchEvent(new Event("click"));
  assert.equal(runtimeMap.flyToCalls.at(-1).zoom, 4);
  markers[1].eventHandlers.get("click")();
  runtimeMap.moveEvents.get("moveend")();
  assert.equal(markers[0].openPopupCount, 1);
  runtimeMap.getZoom = () => 4;

  cards[1].dispatchEvent(new Event("click"));
  assert.equal(markers[1].openPopupCount, 1);
  filters[1].dispatchEvent(new Event("click"));
  assert.equal(cards[1].dataset.active, "true");
  filters[0].dispatchEvent(new Event("click"));
  assert.equal(runtimeMap.layers.size, 2);
  assert.equal(filters[0].dataset.active, "false");
  filters[2].dispatchEvent(new Event("click"));
  assert.equal(filters[0].dataset.active, "false");
  assert.equal(filters[2].dataset.active, "true");
  assert.deepEqual(filters[0].attributes.at(-1), ["aria-pressed", "false"]);
  assert.deepEqual(filters[2].attributes.at(-1), ["aria-pressed", "true"]);
  assert.equal(runtimeMap.layers.has(markers[0]), true);
  assert.equal(runtimeMap.layers.has(markers[1]), false);
  assert.equal(cards[0].dataset.active, "false");
  assert.equal(cards[1].dataset.active, "false");
  assert.deepEqual(cards[0].attributes.at(-1), ["aria-pressed", "false"]);
  assert.deepEqual(cards[1].attributes.at(-1), ["aria-pressed", "false"]);

  cards[0].dataset.placeId = "missing";
  cards[0].dispatchEvent(new Event("click"));
  cards[1].dataset.hidden = "true";
  cards[1].dispatchEvent(new Event("click"));
  controller.abort();
  cards[0].dataset.placeId = "work";
  cards[0].dataset.hidden = "false";
  filters[1].dispatchEvent(new Event("click"));
  assert.equal(runtimeMap.layers.has(markers[1]), false);
  cards[0].dispatchEvent(new Event("click"));
  assert.equal(cards[0].dataset.active, "false");
});

test("About map session validates dependencies, delegates responsive presentation, and cleans failed mounts", () => {
  assert.throws(
    () => createAboutMapSession({ leaflet: null }),
    /The About map session requires a Leaflet adapter/
  );

  const invalidRoot = {
    dataset: { places: "not-json" },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const noOpSession = createAboutMapSession({ leaflet: { point: () => [] } });
  const signal = new AbortController().signal;
  assert.equal(noOpSession.mount(null, signal), false);
  assert.equal(noOpSession.mount(invalidRoot, null), false);
  assert.equal(noOpSession.mount(invalidRoot, signal), false);

  const map = {
    removed: false,
    layers: new Set(),
    setView() {
      return this;
    },
    addLayer(layer) {
      this.layers.add(layer);
      return this;
    },
    removeLayer(layer) {
      this.layers.delete(layer);
    },
    hasLayer(layer) {
      return this.layers.has(layer);
    },
    fitBounds() {},
    getZoom: () => 4,
    getCenter: () => ({ distanceTo: () => 0 }),
    project: () => ({ subtract: () => ({}) }),
    unproject: (center) => center,
    stop() {},
    closePopup() {},
    once() {},
    off() {},
    flyTo() {},
    invalidateSize() {},
    remove() {
      this.removed = true;
    },
  };
  const marker = Object.assign(new EventTarget(), {
    markerOptions: null,
    popup: { options: {} },
    bindPopup(markup, options) {
      this.popup = { markup, options };
      return this;
    },
    addTo(target) {
      target.addLayer(this);
      return this;
    },
    on() {
      return this;
    },
    getPopup() {
      return this.popup;
    },
    setIcon() {
      return this;
    },
    openPopup() {},
  });
  const mapElement = {
    clientHeight: 300,
    classList: { contains: () => false, remove: () => undefined },
  };
  const card = Object.assign(new EventTarget(), {
    dataset: { placeId: "one" },
    scrollIntoView() {},
  });
  const filter = Object.assign(new EventTarget(), { dataset: { filter: "all" } });
  const viewport = Object.assign(new EventTarget(), {
    clientWidth: 100,
    scrollWidth: 100,
    scrollLeft: 0,
    scrollBy() {},
  });
  const root = {
    dataset: {
      places: JSON.stringify([
        {
          id: "one",
          type: "work",
          lat: 1,
          lng: 2,
          image: "/one.jpg",
          title: "one",
          location: "Paris",
          description: "description",
        },
      ]),
    },
    querySelector(selector) {
      return (
        {
          "[data-map-canvas]": mapElement,
          "[data-cards-viewport]": viewport,
          "[data-cards-prev]": Object.assign(new EventTarget(), { disabled: false }),
          "[data-cards-next]": Object.assign(new EventTarget(), { disabled: false }),
          '[data-place-id="one"]': card,
        }[selector] ?? null
      );
    },
    querySelectorAll(selector) {
      return selector === "[data-filter]" ? [filter] : [card];
    },
  };
  const delayed = [];
  const leaflet = {
    map() {
      return map;
    },
    control: { zoom: () => ({ addTo: () => undefined }) },
    tileLayer: () => ({ addTo: () => undefined }),
    marker: (_coordinates, options) => {
      marker.markerOptions = options;
      return marker;
    },
    divIcon: (options) => options,
    point: (x, y) => [x, y],
    latLngBounds: (positions) => positions,
  };
  const sessionController = new AbortController();
  const session = createAboutMapSession({
    leaflet,
    windowRef: Object.assign(new EventTarget(), { innerWidth: 300 }),
    setTimeoutFn: (callback, delay) => {
      delayed.push({ callback, delay });
      return delayed.length;
    },
    clearTimeoutFn: () => undefined,
  });

  assert.equal(session.mount(root, sessionController.signal), true);
  assert.equal(marker.popup.options.maxWidth, 232);
  assert.deepEqual(marker.popup.options.autoPanPaddingTopLeft, [14, 14]);
  assert.match(marker.popup.markup, /one/);
  assert.doesNotMatch(marker.markerOptions.icon.html, /is-selected/);
  assert.deepEqual(
    delayed.map(({ delay }) => delay),
    [80, 400]
  );
  sessionController.abort();
  assert.equal(map.removed, true);

  const failedMap = { ...map, removed: false };
  failedMap.remove = function remove() {
    this.removed = true;
  };
  const failedMarker = Object.assign(new EventTarget(), {
    bindPopup() {
      return this;
    },
    addTo() {
      return this;
    },
    on() {
      throw new Error("runtime setup failed");
    },
  });
  const failingLeaflet = {
    ...leaflet,
    map: () => failedMap,
    marker: () => failedMarker,
  };
  const failingSession = createAboutMapSession({ leaflet: failingLeaflet });
  const failingController = new AbortController();
  const removedEventTypes = [];
  const nativeRemoveEventListener = failingController.signal.removeEventListener.bind(
    failingController.signal
  );
  failingController.signal.removeEventListener = (type, listener, options) => {
    removedEventTypes.push(type);
    return nativeRemoveEventListener(type, listener, options);
  };
  assert.throws(() => failingSession.mount(root, failingController.signal), /runtime setup failed/);
  assert.equal(failedMap.removed, true);
  assert.deepEqual(removedEventTypes, ["abort"]);
});
