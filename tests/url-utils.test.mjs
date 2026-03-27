import test from "node:test";
import assert from "node:assert/strict";

import { toAbsoluteUrl } from "../src/utils/url.ts";

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
