import assert from "node:assert/strict";
import test from "node:test";

import { createAboutMapFixture } from "./helpers/about-map-fixtures.mjs";

test("shared About-map fixtures provide isolated map and DOM state", () => {
  const first = createAboutMapFixture({ createMap: true });
  const second = createAboutMapFixture({ createMap: true });

  assert.notEqual(first.root, second.root);
  assert.notEqual(first.places, second.places);
  assert.notEqual(first.map, second.map);
  assert.notEqual(first.leaflet.state, second.leaflet.state);
});
