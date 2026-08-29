import assert from "node:assert/strict";
import test from "node:test";
import loadGoogleFonts from "../src/utils/loadGoogleFont.ts";

test("local font loader returns both embedded Atkinson weights", async () => {
  const fonts = await loadGoogleFonts();

  assert.deepEqual(
    fonts.map(({ name, weight, style }) => ({ name, weight, style })),
    [
      { name: "Atkinson", weight: 400, style: "normal" },
      { name: "Atkinson", weight: 700, style: "normal" },
    ]
  );
  assert.equal(
    fonts.every(({ data }) => data instanceof ArrayBuffer && data.byteLength > 0),
    true
  );
});

test("local font loader reuses the loaded font collection", async () => {
  const first = await loadGoogleFonts();
  const second = await loadGoogleFonts();

  assert.equal(second, first);
});
