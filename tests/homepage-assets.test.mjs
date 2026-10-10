import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("homepage featured work points at a logo asset that exists in public", () => {
  assert.equal(
    existsSync(new URL("../public/assets/img/about-map/inria-logo.svg", import.meta.url)),
    true
  );
});
