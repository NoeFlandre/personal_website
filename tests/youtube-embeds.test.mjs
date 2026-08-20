import assert from "node:assert/strict";
import test from "node:test";

import {
  buildYouTubeEmbedMarkup,
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

test("buildYouTubeEmbedMarkup uses the normalized video id", () => {
  const markup = buildYouTubeEmbedMarkup("https://youtu.be/abc123XYZ?t=42");

  assert.match(markup, /youtube\.com\/embed\/abc123XYZ/);
  assert.match(markup, /youtube-embed-container/);
  assert.doesNotMatch(markup, /frameborder=/);
});

test("getYouTubeEmbedSrc builds the canonical embed URL from any supported input", () => {
  assert.equal(
    getYouTubeEmbedSrc("https://www.youtube.com/watch?v=abc123XYZ"),
    "https://www.youtube.com/embed/abc123XYZ"
  );
  assert.equal(getYouTubeEmbedSrc("abc123XYZ"), "https://www.youtube.com/embed/abc123XYZ");
});

test("YouTube embed markup rejects unsafe or malformed IDs", () => {
  const unsafeInput = 'https://www.youtube.com/embed/abc"onload="alert(1)';

  assert.equal(extractYouTubeId(unsafeInput), "");
  assert.equal(getYouTubeEmbedSrc(unsafeInput), "https://www.youtube.com/embed/");
  assert.doesNotMatch(buildYouTubeEmbedMarkup(unsafeInput), /onload|alert/);
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
