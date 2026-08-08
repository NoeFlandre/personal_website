import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the site does not retain an unsupported Twitter embed path", () => {
  const packageJson = JSON.parse(read("package.json"));
  const layout = read("src/layouts/Layout.astro");
  const archivedWelcome = read("src/archive/blog/welcome.md");

  assert.equal(
    existsSync(new URL("../src/components/TwitterEmbed.astro", import.meta.url)),
    false,
  );
  assert.equal(packageJson.dependencies?.["astro-embed"], undefined);
  assert.doesNotMatch(layout, /platform\.twitter\.com\/widgets\.js/);
  assert.doesNotMatch(archivedWelcome, /{%\s*twitter\b/);
});
