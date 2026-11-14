import assert from "node:assert/strict";
import test from "node:test";
import { removeStylesheetLinksFromStaticRedirect } from "../src/utils/removeStylesheetLinksFromStaticRedirect.mjs";
import { readRepoFile } from "./helpers/repo-files.mjs";

test("disabled archives render a valid noindex redirect page", () => {
  const archivePage = readRepoFile("src/pages/archives/index.astro");
  const redirectPage = readRepoFile("src/components/StaticRedirect.astro");
  const archiveContent = readRepoFile("src/features/blog/components/ArchivesPage.astro");

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

test("redirect cleanup removes stylesheet links wherever rel appears and keeps other links", () => {
  const redirectMarkup =
    '<html><head><link href="/styles.css" rel="stylesheet"><link rel="icon" href="/icon.svg"></head><body data-static-redirect></body></html>';

  assert.equal(
    removeStylesheetLinksFromStaticRedirect(redirectMarkup),
    '<html><head><link rel="icon" href="/icon.svg"></head><body data-static-redirect></body></html>'
  );
});
