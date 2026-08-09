import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function getMarkdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = new URL(entry.name, directory);

    if (entry.isDirectory()) {
      return getMarkdownFiles(new URL(`${entry.name}/`, directory));
    }

    return /\.mdx?$/.test(entry.name) ? [path] : [];
  });
}

test("the site does not retain an unsupported Twitter embed path", () => {
  const packageJson = JSON.parse(read("package.json"));
  const layout = read("src/layouts/Layout.astro");

  assert.equal(existsSync(new URL("../src/components/TwitterEmbed.astro", import.meta.url)), false);
  assert.equal(packageJson.dependencies?.["astro-embed"], undefined);
  assert.doesNotMatch(layout, /platform\.twitter\.com\/widgets\.js/);

  for (const path of getMarkdownFiles(new URL("../src/content/blog/", import.meta.url))) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /{%\s*twitter\b/);
  }
});
