import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("YouTube documentation matches the active embed implementation", () => {
  const docs = read("docs/YOUTUBE.MD");
  const clientModule = read("src/features/blog/client/postDetailsRerun.js");
  const sessionModule = read("src/features/blog/client/postDetailsSession.js");
  const implementation = `${clientModule}\n${sessionModule}`;

  assert.match(docs, /postDetailsRerun\.js.*client module/i);
  assert.doesNotMatch(docs, /MDXTwitterTransform/);
  assert.match(implementation, /youtubeEmbedRegex/);
  assert.equal(
    existsSync(new URL("../src/components/MDXTwitterTransform.astro", import.meta.url)),
    false
  );
  assert.equal(existsSync(new URL("../src/components/YouTubeEmbed.astro", import.meta.url)), false);
});
