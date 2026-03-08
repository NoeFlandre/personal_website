import test from "node:test";
import assert from "node:assert/strict";

import { buildYouTubeEmbedMarkup, extractYouTubeId } from "../src/utils/youtubeEmbeds.js";

test("extractYouTubeId supports watch, short, embed, and raw ids", () => {
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=abc123XYZ"), "abc123XYZ");
  assert.equal(extractYouTubeId("https://youtu.be/abc123XYZ?t=42"), "abc123XYZ");
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/abc123XYZ?start=10"), "abc123XYZ");
  assert.equal(extractYouTubeId("abc123XYZ"), "abc123XYZ");
});

test("buildYouTubeEmbedMarkup uses the normalized video id", () => {
  const markup = buildYouTubeEmbedMarkup("https://youtu.be/abc123XYZ?t=42");

  assert.match(markup, /youtube\.com\/embed\/abc123XYZ/);
  assert.match(markup, /youtube-embed-container/);
});
