import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Pagefind integration keeps a local type boundary without compiler suppressions", () => {
  const declarations = read("src/types.d.ts");
  const search = read("src/features/search/client/search.js");

  assert.match(declarations, /declare module "@pagefind\/default-ui"/);
  assert.doesNotMatch(search, /@ts-(?:expect-error|ignore|nocheck)/);
});
