import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("post details client module is bundled and reruns after navigation", () => {
  const layout = read("src/layouts/PostDetails.astro");
  const clientModule = read("src/features/blog/client/postDetailsRerun.js");
  const sessionModule = read("src/features/blog/client/postDetailsSession.js");

  assert.match(
    clientModule,
    /import\s+\{\s*createPostDetailsSession\s*\}\s+from\s+"\.\/postDetailsSession\.js";/
  );
  assert.match(sessionModule, /buildYouTubeEmbedMarkup/);
  assert.match(
    layout,
    /<script>[\s\S]*import\s+\{\s*initPostDetails\s*\}\s+from\s+"@\/features\/blog\/client\/postDetailsRerun\.js";[\s\S]*document\.addEventListener\("astro:page-load",\s*initPostDetails\);[\s\S]*initPostDetails\(\);[\s\S]*<\/script>/
  );
  assert.doesNotMatch(layout, /postDetailsRerun\.js\?url/);
  assert.doesNotMatch(layout, /data-astro-rerun/);
  assert.match(clientModule, /export function initPostDetails\(/);
  assert.match(clientModule, /session\.mount\(article, signal\)/);
  assert.doesNotMatch(clientModule, /initPostDetails\(\);/);
});
