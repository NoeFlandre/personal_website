import assert from "node:assert/strict";
import test from "node:test";

const aboutMapSession = await import("../src/features/about/client/aboutMapSession.js");

function createMapFixture() {
  const places = [
    { id: "work", type: "work", title: "Work", lat: 48, lng: 2 },
    { id: "travel", type: "travel", title: "Travel", lat: 28, lng: 77 },
  ];
  const filters = ["all", "work"].map((filter) =>
    Object.assign(new EventTarget(), {
      dataset: { filter },
      attributes: [],
      setAttribute(name, value) {
        this.attributes.push([name, value]);
      },
    })
  );
  const cards = places.map((place) =>
    Object.assign(new EventTarget(), {
      dataset: { placeId: place.id, hidden: "false" },
      attributes: [],
      setAttribute(name, value) {
        this.attributes.push([name, value]);
      },
      scrollIntoView() {},
    })
  );
  const root = {
    querySelector(selector) {
      const placeId = selector.match(/data-place-id="([^"]+)"/)?.[1];
      return cards.find((card) => card.dataset.placeId === placeId) ?? null;
    },
  };
  const map = {
    layers: new Set(),
    fitBoundsCalls: [],
    addLayer(marker) {
      this.layers.add(marker);
      return this;
    },
    removeLayer(marker) {
      this.layers.delete(marker);
    },
    fitBounds(bounds, options) {
      this.fitBoundsCalls.push({ bounds, options });
    },
    getZoom() {
      return 4;
    },
  };
  const markers = [];
  const leaflet = {
    marker(coordinates, options) {
      const marker = Object.assign(new EventTarget(), {
        coordinates,
        options,
        handlers: new Map(),
        on(name, callback) {
          this.handlers.set(name, callback);
          return this;
        },
        bindPopup() {
          return this;
        },
        addTo(targetMap) {
          targetMap.addLayer(this);
          return this;
        },
        setIcon() {
          return this;
        },
      });
      markers.push(marker);
      return marker;
    },
    latLngBounds(positions) {
      return { positions };
    },
  };

  return { places, filters, cards, root, map, markers, leaflet };
}

test("interaction coordinator owns marker setup and filter visibility", () => {
  assert.equal(typeof aboutMapSession.createMapInteractionCoordinator, "function");

  const fixture = createMapFixture();
  const controller = new AbortController();
  const scheduled = [];
  const coordinator = aboutMapSession.createMapInteractionCoordinator({
    map: {
      leaflet: fixture.leaflet,
      instance: fixture.map,
      element: { clientHeight: 300 },
    },
    places: fixture.places,
    ui: {
      root: fixture.root,
      filterButtons: fixture.filters,
      cardButtons: fixture.cards,
      cardsViewport: null,
    },
    environment: { windowRef: { innerWidth: 1024 } },
    lifecycle: {
      signal: controller.signal,
      clearTimeoutFn: () => undefined,
      scheduleTimeout: (callback, delay) => {
        scheduled.push({ callback, delay });
      },
    },
    presentation: {
      markerIcon: (type) => ({ type }),
      popupMarkup: (place) => `popup:${place.id}`,
      popupMaxWidth: () => 250,
      popupPanPadding: () => [22, 22],
    },
    updateCardsNav: () => undefined,
  });

  coordinator.start();

  assert.equal(fixture.markers.length, 2);
  assert.equal(fixture.map.layers.size, 2);
  assert.deepEqual(fixture.map.fitBoundsCalls[0].bounds.positions, [
    [48, 2],
    [28, 77],
  ]);
  assert.deepEqual(
    scheduled.map(({ delay }) => delay),
    [80, 400]
  );

  fixture.filters[1].dispatchEvent(new Event("click"));

  assert.equal(fixture.map.layers.size, 1);
  assert.equal(fixture.cards[0].dataset.hidden, "false");
  assert.equal(fixture.cards[1].dataset.hidden, "true");
  assert.equal(fixture.filters[1].dataset.active, "true");
});
