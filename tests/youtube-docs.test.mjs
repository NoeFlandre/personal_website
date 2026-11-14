import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { readRepoFile } from "./helpers/repo-files.mjs";

test("YouTube documentation matches the active embed implementation", () => {
  const docs = readRepoFile("docs/YOUTUBE.MD");
  const clientModule = readRepoFile("src/features/blog/client/postDetailsRerun.js");
  const sessionModule = readRepoFile("src/features/blog/client/postDetailsSession.js");
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
