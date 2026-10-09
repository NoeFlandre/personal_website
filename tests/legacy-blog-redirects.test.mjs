import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);
const { redirects } = JSON.parse(readFileSync(fromRoot("vercel.json"), "utf8"));

test("vercel.json permanently redirects the exact /blog index and nested legacy blog paths", () => {
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.source === "/blog" &&
        redirect.destination === "/posts" &&
        redirect.permanent === true
    ),
    "/blog should permanently redirect to /posts"
  );
  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.source === "/blog/:path*" &&
        redirect.destination === "/posts/:path*" &&
        redirect.permanent === true
    ),
    "/blog/:path* should permanently redirect to /posts/:path*"
  );
});

test("the nested legacy blog redirect comes after the dated and single-segment rules", () => {
  const indexOf = (source) => redirects.findIndex((redirect) => redirect.source === source);
  const nested = indexOf("/blog/:path*");
  const dated = indexOf("/blog/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug");
  const single = indexOf("/blog/:slug([^\\/]+)$");

  assert.notEqual(nested, -1, "/blog/:path* should exist");
  assert.ok(dated < nested, "the dated rule must stay ahead of the catch-all");
  assert.ok(single < nested, "the single-segment rule must stay ahead of the catch-all");
});

test("legacy redirects live only in vercel.json, so src/middleware.js stays removed", () => {
  assert.equal(
    existsSync(fromRoot("src/middleware.js")),
    false,
    "src/middleware.js should stay removed"
  );
});
