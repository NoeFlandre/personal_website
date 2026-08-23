import assert from "node:assert/strict";
import test from "node:test";
import { createAboutMapFixture } from "./helpers/about-map-fixtures.mjs";

const aboutMapSession = await import("../src/features/about/client/aboutMapSession.js");

test("interaction coordinator owns marker setup and filter visibility", () => {
  assert.equal(typeof aboutMapSession.createMapInteractionCoordinator, "function");

  const fixture = createAboutMapFixture({ createMap: true, filterValues: ["all", "work"] });
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
      filterButtons: fixture.filterButtons,
      cardButtons: fixture.cardButtons,
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

  assert.equal(fixture.leaflet.state.markers.length, 2);
  assert.equal(fixture.map.layers.size, 2);
  assert.deepEqual(fixture.map.fitBoundsCalls[0].bounds.positions, [
    [48, 2],
    [28, 77],
  ]);
  assert.deepEqual(
    scheduled.map(({ delay }) => delay),
    [80, 400]
  );

  fixture.filterButtons[1].dispatchEvent(new Event("click"));

  assert.equal(fixture.map.layers.size, 1);
  assert.equal(fixture.cardButtons[0].dataset.hidden, "false");
  assert.equal(fixture.cardButtons[1].dataset.hidden, "true");
  assert.equal(fixture.filterButtons[1].dataset.active, "true");
});
