import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("PostDetails consumes post layout metadata without an unused canonical alias", () => {
  const postDetails = readFileSync(
    new URL("../src/layouts/PostDetails.astro", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(postDetails, /canonicalURL:\s*computedCanonicalURL/);
  assert.match(postDetails, /const\s+\{\s*postPath,\s*ogImage,\s*layoutProps\s*\}\s*=\s*buildPostLayoutMetadata\(/);
});
