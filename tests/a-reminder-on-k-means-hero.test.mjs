import assert from "node:assert/strict";
import test from "node:test";
import { readRepoFile } from "./helpers/repo-files.mjs";

test("the k-means hero spans the full text column instead of the 640px default", () => {
  const css = readRepoFile("src/styles/typography.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const [, body = ""] =
    css.match(
      /\.prose > img\[src="\/assets\/img\/2026\/a-reminder-on-k-means\/kmeans-summary\.png"\]\s*\{([^}]*)\}/
    ) ?? [];

  assert.ok(body.trim().length > 0, "k-means hero rule not found in typography.css");
  assert.match(body, /max-width:\s*100%/);
});
