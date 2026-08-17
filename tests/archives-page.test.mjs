import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { removeStylesheetLinksFromStaticRedirect } from "../src/utils/removeStylesheetLinksFromStaticRedirect.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("disabled archives render a valid noindex redirect page", () => {
  const archivePage = read("src/pages/archives/index.astro");
  const redirectPage = read("src/components/StaticRedirect.astro");
  const archiveContent = read("src/features/blog/components/ArchivesPage.astro");

  assert.doesNotMatch(archivePage, /return Astro\.redirect/);
  assert.doesNotMatch(archivePage, /import Layout from/);
  assert.match(archivePage, /await import\(["'][^"']*ArchivesPage\.astro["']\)/);
  assert.match(archivePage, /<StaticRedirect\s+from="\/archives"\s+to="\/404"/);
  assert.match(archiveContent, /<Layout\s+title=/);
  assert.match(redirectPage, /<!doctype html>/i);
  assert.match(redirectPage, /<html\b/i);
  assert.match(redirectPage, /data-static-redirect/);
  assert.match(redirectPage, /http-equiv="refresh"/);
  assert.match(redirectPage, /name="robots"\s+content="noindex"/);
});

test("redirect cleanup removes only stylesheet links from static redirects", () => {
  const redirectMarkup =
    '<html><head><link rel="stylesheet" href="/styles.css"></head><body data-static-redirect></body></html>';
  const regularMarkup =
    '<html><head><link rel="stylesheet" href="/styles.css"></head><body></body></html>';

  assert.doesNotMatch(removeStylesheetLinksFromStaticRedirect(redirectMarkup), /rel="stylesheet"/);
  assert.match(removeStylesheetLinksFromStaticRedirect(regularMarkup), /rel="stylesheet"/);
});
