import assert from "node:assert/strict";
import test from "node:test";

import { criticalCSS, getPageCriticalCSS } from "../src/utils/criticalCSS.ts";

test("homepage critical CSS adds the hero image rules", () => {
  const css = getPageCriticalCSS("/");

  assert.match(css, /#hero img/);
  assert.match(css, /border-radius: 9999px/);
  assert.match(css, /--background/);
});

test("post critical CSS adds article and code-block rules", () => {
  const css = getPageCriticalCSS("/posts/georeasoner");

  assert.match(css, /\.prose h1/);
  assert.match(css, /\.prose pre/);
  assert.match(css, /overflow-x: auto/);
});

test("other pages receive the shared critical CSS only", () => {
  assert.equal(getPageCriticalCSS("/about"), criticalCSS);
  assert.equal(getPageCriticalCSS(""), getPageCriticalCSS("/"));
});
