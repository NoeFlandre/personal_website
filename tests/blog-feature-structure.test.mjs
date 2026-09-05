import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("blog tag presentation uses the shared filter route helper", () => {
  const tagComponent = readFileSync(
    new URL("../src/components/Tag.astro", import.meta.url),
    "utf8"
  );
  const tagPage = readFileSync(
    new URL("../src/pages/tags/[tag]/[...page].astro", import.meta.url),
    "utf8"
  );
  const filterBar = readFileSync(
    new URL("../src/features/blog/components/PostFilterBar.astro", import.meta.url),
    "utf8"
  );
  const filterOptions = readFileSync(
    new URL("../src/features/blog/utils/getPostFilterOptions.ts", import.meta.url),
    "utf8"
  );

  assert.match(tagComponent, /getTagPath/);
  assert.match(filterOptions, /getTagPath/);
  assert.match(filterBar, /getPostFilterOptions/);
  assert.match(tagPage, /PostFilterBar/);
});
