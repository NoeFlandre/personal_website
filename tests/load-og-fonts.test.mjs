import assert from "node:assert/strict";
import test from "node:test";
import loadOgFonts from "../src/utils/loadOgFonts.ts";

test("OG font loader returns both embedded Atkinson weights", async () => {
  const fonts = await loadOgFonts();

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

test("OG font loader reuses the loaded font collection", async () => {
  const first = await loadOgFonts();
  const second = await loadOgFonts();

  assert.equal(second, first);
});
