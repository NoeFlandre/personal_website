import test from "node:test";
import assert from "node:assert/strict";

import {
  getMapRetryDelayMs,
  parsePlacesDataset,
  shouldRetryMapInit,
  sortPlacesForUi,
} from "../src/utils/aboutMap.js";

test("sortPlacesForUi keeps work first, then study, then travel", () => {
  const input = [
    { id: "t", type: "travel" },
    { id: "w", type: "work" },
    { id: "s", type: "study" },
  ];

  const sorted = sortPlacesForUi(input);
  assert.deepEqual(
    sorted.map(item => item.id),
    ["w", "s", "t"]
  );
});

test("parsePlacesDataset returns parsed places array for valid JSON", () => {
  const raw = JSON.stringify([{ id: "x", type: "work" }]);
  const parsed = parsePlacesDataset(raw);

  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, "x");
});

test("parsePlacesDataset returns [] for invalid payloads", () => {
  assert.deepEqual(parsePlacesDataset(""), []);
  assert.deepEqual(parsePlacesDataset("not-json"), []);
  assert.deepEqual(parsePlacesDataset("{\"foo\":1}"), []);
});

test("shouldRetryMapInit allows first three attempts only", () => {
  assert.equal(shouldRetryMapInit(0), true);
  assert.equal(shouldRetryMapInit(1), true);
  assert.equal(shouldRetryMapInit(2), true);
  assert.equal(shouldRetryMapInit(3), false);
});

test("getMapRetryDelayMs grows linearly with attempts", () => {
  assert.equal(getMapRetryDelayMs(1), 600);
  assert.equal(getMapRetryDelayMs(2), 1200);
  assert.equal(getMapRetryDelayMs(3), 1800);
});
