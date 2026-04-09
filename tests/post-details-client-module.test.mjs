import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("post details rerun behavior lives in a dedicated client module", () => {
  const layout = read("src/layouts/PostDetails.astro");
  const clientModule = read("src/features/blog/client/postDetailsRerun.js");

  assert.match(clientModule, /import\s+\{\s*buildYouTubeEmbedMarkup\s*\}\s+from\s+"\.\.\/\.\.\/\.\.\/utils\/youtubeEmbeds\.js";/);
  assert.match(
    layout,
    /import\s+postDetailsRerunUrl\s+from\s+"@\/features\/blog\/client\/postDetailsRerun\.js\?url";/
  );
  assert.match(
    layout,
    /<script\s+is:inline\s+type="module"\s+data-astro-rerun\s+define:vars=\{\{\s*postDetailsRerunUrl\s*\}\}>[\s\S]*import\(postDetailsRerunUrl\)\.then\(\(\{\s*initPostDetails\s*\}\)\s*=>\s*initPostDetails\(\)\);[\s\S]*<\/script>/
  );
  assert.doesNotMatch(layout, /import\s+\{\s*initPostDetails\s*\}/);
  assert.match(clientModule, /export function initPostDetails\(/);
  assert.doesNotMatch(clientModule, /initPostDetails\(\);/);
});
