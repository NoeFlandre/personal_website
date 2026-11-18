import assert from "node:assert/strict";
import test from "node:test";

import {
  extractYouTubeId,
  getYouTubeEmbedSrc,
  normalizeYouTubeId,
} from "../src/utils/youtubeEmbeds.js";

test("normalizeYouTubeId trims valid ids and rejects non-string values", () => {
  assert.equal(normalizeYouTubeId("  abc123XYZ  "), "abc123XYZ");
  assert.equal(normalizeYouTubeId(null), "");
  assert.equal(normalizeYouTubeId(42), "");
});

test("extractYouTubeId supports watch, short, embed, and raw ids", () => {
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=abc123XYZ"), "abc123XYZ");
  assert.equal(extractYouTubeId("https://youtu.be/abc123XYZ?t=42"), "abc123XYZ");
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/abc123XYZ?start=10"), "abc123XYZ");
  assert.equal(extractYouTubeId("abc123XYZ"), "abc123XYZ");
  assert.equal(extractYouTubeId("  abc123XYZ  "), "abc123XYZ");
  assert.equal(extractYouTubeId("/abc123XYZ"), "");
});

test("extractYouTubeId prioritizes watch, then short, then embed markers", () => {
  const overlappingPaths = "https://www.youtube.com/embed/embedId?short=https://youtu.be/shortId";

  assert.equal(
    extractYouTubeId(`${overlappingPaths}?watch=youtube.com/watch&v=watchId`),
    "watchId"
  );
  assert.equal(extractYouTubeId(overlappingPaths), "shortId");
});

test("extractYouTubeId does not fall through recognized markers with rejected ids", () => {
  const embedUrl = "https://www.youtube.com/embed/embedId";
  const shortUrl = `https://youtu.be/shortId?embed=${embedUrl}`;

  for (const input of [
    `https://www.youtube.com/watch?v=&next=${shortUrl}`,
    `https://www.youtube.com/watch?v=%ZZ&next=${shortUrl}`,
    `https://youtu.be/?next=${embedUrl}`,
    `https://youtu.be/invalid!id?next=${embedUrl}`,
  ]) {
    assert.equal(extractYouTubeId(input), "", input);
  }
});

test("getYouTubeEmbedSrc builds the canonical embed URL from any supported input", () => {
  assert.equal(
    getYouTubeEmbedSrc("https://www.youtube.com/watch?v=abc123XYZ"),
    "https://www.youtube.com/embed/abc123XYZ"
  );
  assert.equal(getYouTubeEmbedSrc("abc123XYZ"), "https://www.youtube.com/embed/abc123XYZ");
});

test("YouTube embed src rejects unsafe or malformed IDs", () => {
  const unsafeInput = 'https://www.youtube.com/embed/abc"onload="alert(1)';

  assert.equal(extractYouTubeId(unsafeInput), "");
  assert.equal(getYouTubeEmbedSrc(unsafeInput), "https://www.youtube.com/embed/");
});

test("extractYouTubeId handles empty, non-string, and malformed watch inputs", () => {
  assert.equal(extractYouTubeId(""), "");
  assert.equal(extractYouTubeId(null), "");
  assert.equal(extractYouTubeId(42), "");
  assert.equal(extractYouTubeId("   "), "");
  assert.equal(extractYouTubeId("youtube.com/watch?v=abc123XYZ"), "");
  assert.equal(extractYouTubeId("https://www.youtube.com/watch"), "");
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=%ZZ"), "");
  assert.equal(extractYouTubeId("https://[invalid]/youtube.com/watch?v=abc123XYZ"), "");
});
