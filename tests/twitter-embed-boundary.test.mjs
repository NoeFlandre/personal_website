import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { readRepoFile } from "./helpers/repo-files.mjs";

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
  const packageJson = JSON.parse(readRepoFile("package.json"));
  const layout = readRepoFile("src/layouts/Layout.astro");

  assert.equal(existsSync(new URL("../src/components/TwitterEmbed.astro", import.meta.url)), false);
  assert.equal(packageJson.dependencies?.["astro-embed"], undefined);
  assert.doesNotMatch(layout, /platform\.twitter\.com\/widgets\.js/);
  assert.doesNotMatch(readRepoFile("src/env.d.ts"), /twttr/);

  for (const path of getMarkdownFiles(new URL("../src/content/blog/", import.meta.url))) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /{%\s*twitter\b/);
  }
});
