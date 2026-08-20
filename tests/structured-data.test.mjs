import assert from "node:assert/strict";
import test from "node:test";

import { SITE } from "../src/site-config.js";
import { buildStructuredData, serializeStructuredData } from "../src/utils/structuredData.ts";

test("buildStructuredData uses the configured site URL for website data", () => {
  const structuredData = buildStructuredData("WebSite");

  assert.deepEqual(structuredData, {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    url: SITE.website,
    description: SITE.desc,
    author: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.profile,
    },
  });
  assert.equal(structuredData["@type"], "WebSite");
  assert.equal(structuredData.url, SITE.website);
  assert.equal("potentialAction" in structuredData, false);
  assert.doesNotMatch(JSON.stringify(structuredData), /github\.io/);
});

test("buildStructuredData uses the configured profile and image for person data", () => {
  const structuredData = buildStructuredData("Person");

  assert.deepEqual(structuredData, {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.author,
    url: SITE.profile,
    image: `${SITE.website}${SITE.ogImage}`,
    sameAs: [
      "https://github.com/NoeFlandre",
      "https://x.com/NoeFlandre",
      "https://huggingface.co/NoeFlandre",
      "https://orcid.org/0009-0002-0237-3727",
    ],
    jobTitle: "AI Research Engineer, vibe-learning",
    description: SITE.desc,
  });
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

  assert.deepEqual(structuredData, {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "A test post",
    description: "A test description",
    author: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.profile,
    },
    datePublished: publishedAt.toISOString(),
    dateModified: publishedAt.toISOString(),
    publisher: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.profile,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.website}${SITE.ogImage}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE.website}posts/a-test-post`,
    },
    image: `${SITE.website}${SITE.ogImage}`,
  });
  assert.equal(structuredData["@type"], "BlogPosting");
  assert.equal(structuredData.datePublished, publishedAt.toISOString());
  assert.equal(structuredData.dateModified, publishedAt.toISOString());
  assert.equal(structuredData.image, `${SITE.website}${SITE.ogImage}`);
  assert.equal(structuredData.author.name, SITE.author);
  assert.equal("wordCount" in structuredData, false);
  assert.equal("timeRequired" in structuredData, false);
  assert.doesNotMatch(JSON.stringify(structuredData), /undefined/);
});

test("buildStructuredData includes optional blog metadata when provided", () => {
  const structuredData = buildStructuredData("BlogPosting", {
    title: "A complete test post",
    description: "A complete test description",
    pubDatetime: new Date("2026-08-07T12:00:00.000Z"),
    url: "/posts/complete-test-post",
    tags: ["Post", "Research"],
    wordCount: 512,
    readingTime: "3 min read",
  });

  assert.equal(structuredData.articleSection, "Post");
  assert.equal(structuredData.keywords, "Post, Research");
  assert.equal(structuredData.wordCount, 512);
  assert.equal(structuredData.timeRequired, "3 min read");
  assert.equal(structuredData.author.name, SITE.author);
});

test("buildStructuredData rejects a BlogPosting without post data", () => {
  assert.throws(() => buildStructuredData("BlogPosting"), /requires post data/);
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

test("serializeStructuredData escapes JSON-LD line separators and ampersands", () => {
  const serialized = serializeStructuredData({ value: "&\u2028\u2029" });

  assert.match(serialized, /\\u0026/);
  assert.match(serialized, /\\u2028/);
  assert.match(serialized, /\\u2029/);
  assert.doesNotMatch(serialized, /[\u2028\u2029]/);
});
