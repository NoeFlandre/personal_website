import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getLegacyFeedGuid,
  getLegacyFeedItemXml,
  LEGACY_POST_PATHS,
} from "../src/features/blog/utils/legacyPostPaths.ts";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);

test("a moved post keeps its old absolute URL as the feed guid, with the trailing slash feed items use", () => {
  assert.equal(
    getLegacyFeedGuid("/posts/2026/distilling_abms"),
    "https://noeflandre.com/posts/distilling_abms/"
  );
  assert.equal(
    getLegacyFeedGuid("/posts/2024/llms-conceptual-modeling"),
    undefined,
    "drafts never had a public URL, so they are not in the map"
  );
});

test("a post that never moved gets no guid override", () => {
  assert.equal(getLegacyFeedGuid("/posts/2026/attention-pooling"), undefined);
});

test("every moved post maps a year-folder URL back to its original root URL", () => {
  for (const [current, previous] of LEGACY_POST_PATHS) {
    assert.match(current, /^\/posts\/\d{4}\/[^/]+$/);
    assert.match(previous, /^\/posts\/[^/]+$/);
    assert.equal(current.split("/").pop(), previous.split("/").pop());
  }
});

test("the feed sends the legacy guid for moved posts only", () => {
  const feed = readFileSync(fromRoot("src/pages/rss.xml.ts"), "utf8");

  assert.match(feed, /getLegacyFeedItemXml\(link\)/);
  assert.match(feed, /customData:/);
});

test("the feed item for a moved post carries the legacy guid as XML, and other posts carry none", () => {
  assert.equal(
    getLegacyFeedItemXml("/posts/2026/distilling_abms"),
    '<guid isPermaLink="true">https://noeflandre.com/posts/distilling_abms/</guid>'
  );
  assert.equal(getLegacyFeedItemXml("/posts/2026/attention-pooling"), undefined);
});
