import assert from "node:assert/strict";
import test from "node:test";

import * as siteConfig from "../src/site-config.js";

const { SHARE_LINKS, SITE, SOCIALS } = siteConfig;

test("site-config does not export unused title, description, or nav aliases", () => {
  for (const name of ["SITE_TITLE", "SITE_DESCRIPTION", "NAV_LINKS"]) {
    assert.equal(Object.hasOwn(siteConfig, name), false, `${name} should not be exported`);
  }
});

test("site-config exposes expected social and share link collections", () => {
  assert.ok(SOCIALS.length > 0);
  assert.ok(SHARE_LINKS.length > 0);
  assert.ok(SOCIALS.every((entry) => typeof entry.href === "string" && entry.href.length > 0));
});

test("site-config keeps the identity values other modules rely on", () => {
  assert.equal(SITE.website, "https://noeflandre.com/");
  assert.equal(SITE.title, "Noé Flandre");
  assert.equal(SITE.author, "Noé Flandre");
  assert.equal(SITE.timezone, "America/Los_Angeles");
});

test("site-config social and share links have the fields their components render", () => {
  for (const link of [...SOCIALS, ...SHARE_LINKS]) {
    for (const field of ["name", "href", "linkTitle", "icon"]) {
      assert.ok(link[field], `${link.name} is missing ${field}`);
    }
  }
});
