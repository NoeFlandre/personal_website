import test from "node:test";
import assert from "node:assert/strict";

import { getAbsoluteUrlBase, toAbsoluteUrl } from "../src/utils/url.ts";

test("toAbsoluteUrl resolves relative paths against the provided base URL", () => {
  assert.equal(
    toAbsoluteUrl("/posts/example", "https://example.com/blog/"),
    "https://example.com/posts/example"
  );
});

test("toAbsoluteUrl preserves already-absolute URLs", () => {
  assert.equal(
    toAbsoluteUrl("https://cdn.example.com/image.png", "https://example.com/"),
    "https://cdn.example.com/image.png"
  );
});

test("getAbsoluteUrlBase falls back to the current URL when site base is undefined", () => {
  assert.equal(
    getAbsoluteUrlBase(undefined, "https://preview.local/posts/example"),
    "https://preview.local/posts/example"
  );
});

test("getAbsoluteUrlBase prefers the configured site base when available", () => {
  assert.equal(
    getAbsoluteUrlBase("https://example.com/", "https://preview.local/posts/example"),
    "https://example.com/"
  );
});
