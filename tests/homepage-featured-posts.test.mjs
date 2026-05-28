import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homepage featured posts include the editor pick milestone instead of the AI survival guide", () => {
  const homepage = read("src/pages/index.astro");
  const survivalGuide = read("src/content/blog/survival_guide_in_ai.md");
  const editorPickPost = read("src/content/blog/editor-pick-empathy-simulation.md");

  assert.match(
    homepage,
    /"A small milestone for our empathy and simulation paper"/
  );
  assert.doesNotMatch(homepage, /"An AI survival guide"/);
  assert.match(editorPickPost, /featured: true/);
  assert.match(survivalGuide, /featured: false/);
});
