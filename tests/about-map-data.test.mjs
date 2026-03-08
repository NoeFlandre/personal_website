import test from "node:test";
import assert from "node:assert/strict";

import { ABOUT_MAP_PLACES } from "../src/data/aboutMapPlaces.ts";

test("ABOUT_MAP_PLACES covers the expected place types", () => {
  const types = new Set(ABOUT_MAP_PLACES.map((place) => place.type));

  assert.deepEqual([...types].sort(), ["study", "travel", "work"]);
});

test("ABOUT_MAP_PLACES entries have unique ids and valid coordinates", () => {
  const ids = new Set();

  for (const place of ABOUT_MAP_PLACES) {
    assert.equal(typeof place.id, "string");
    assert.notEqual(place.id.length, 0);
    assert.equal(ids.has(place.id), false);
    ids.add(place.id);

    assert.equal(typeof place.title, "string");
    assert.notEqual(place.title.length, 0);
    assert.equal(typeof place.location, "string");
    assert.equal(typeof place.period, "string");
    assert.equal(typeof place.description, "string");
    assert.equal(typeof place.image, "string");
    assert.equal(Number.isFinite(place.lat), true);
    assert.equal(Number.isFinite(place.lng), true);
  }
});
