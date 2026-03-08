import test from "node:test";
import assert from "node:assert/strict";

import { SHARE_LINKS, SITE, SITE_DESCRIPTION, SITE_TITLE, SOCIALS } from "../src/site-config.js";

test("site-config exposes the site title and description aliases", () => {
  assert.equal(SITE_TITLE, SITE.title);
  assert.equal(SITE_DESCRIPTION, SITE.desc);
});

test("site-config exposes expected social and share link collections", () => {
  assert.ok(SOCIALS.length > 0);
  assert.ok(SHARE_LINKS.length > 0);
  assert.ok(SOCIALS.every((entry) => typeof entry.href === "string" && entry.href.length > 0));
});
