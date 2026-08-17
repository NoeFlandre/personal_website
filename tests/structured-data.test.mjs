import assert from "node:assert/strict";
import test from "node:test";

import { SITE } from "../src/site-config.js";
import { buildStructuredData, serializeStructuredData } from "../src/utils/structuredData.ts";

test("buildStructuredData uses the configured site URL for website data", () => {
  const structuredData = buildStructuredData("WebSite");

  assert.equal(structuredData["@type"], "WebSite");
  assert.equal(structuredData.url, SITE.website);
  assert.equal("potentialAction" in structuredData, false);
  assert.doesNotMatch(JSON.stringify(structuredData), /github\.io/);
});

test("buildStructuredData uses the configured profile and image for person data", () => {
  const structuredData = buildStructuredData("Person");

  assert.equal(structuredData["@type"], "Person");
  assert.equal(structuredData.url, SITE.profile);
  assert.equal(structuredData.image, `${SITE.website}${SITE.ogImage}`);
  assert.doesNotMatch(JSON.stringify(structuredData), /github\.io/);
});

test("buildStructuredData omits undefined optional blog fields", () => {
  const publishedAt = new Date("2026-08-07T12:00:00.000Z");
  const structuredData = buildStructuredData("BlogPosting", {
    title: "A test post",
    description: "A test description",
    author: SITE.author,
    pubDatetime: publishedAt,
    modDatetime: null,
    url: `${SITE.website}posts/a-test-post`,
  });

  assert.equal(structuredData["@type"], "BlogPosting");
  assert.equal(structuredData.datePublished, publishedAt.toISOString());
  assert.equal(structuredData.dateModified, publishedAt.toISOString());
  assert.equal(structuredData.image, `${SITE.website}${SITE.ogImage}`);
  assert.equal("wordCount" in structuredData, false);
  assert.equal("timeRequired" in structuredData, false);
  assert.doesNotMatch(JSON.stringify(structuredData), /undefined/);
});

test("serializeStructuredData prevents markup from closing the JSON-LD script", () => {
  const structuredData = buildStructuredData("BlogPosting", {
    title: "</script><script>alert(1)</script>",
    description: "A test description",
    pubDatetime: new Date("2026-08-07T12:00:00.000Z"),
    url: `${SITE.website}posts/safe-json-ld`,
  });

  const serialized = serializeStructuredData(structuredData);

  assert.doesNotMatch(serialized, /<\/script>/i);
  assert.match(serialized, /\\u003c\/script\\u003e/i);
});
