import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("disabled archives render a valid noindex redirect page", () => {
  const archivePage = read("src/pages/archives/index.astro");
  const redirectPage = read("src/components/StaticRedirect.astro");

  assert.doesNotMatch(archivePage, /return Astro\.redirect/);
  assert.match(archivePage, /<StaticRedirect\s+from="\/archives"\s+to="\/404"/);
  assert.match(redirectPage, /<!doctype html>/i);
  assert.match(redirectPage, /<html\b/i);
  assert.match(redirectPage, /data-pagefind-ignore/);
  assert.match(redirectPage, /http-equiv="refresh"/);
  assert.match(redirectPage, /name="robots"\s+content="noindex"/);
});
