import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = new URL("../../", import.meta.url).pathname;

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : [full];
    })
  );
  return files.flat();
}

// The local writing tool must never reach the deployed site. These markers
// only exist in the writer, so finding one in site source would mean the
// writer leaked into the build.
const WRITER_MARKERS = ["scripts/write", "x-writer", "/api/render", "/api/posts"];

test("site source, public assets, and Astro config never reference the local writer", async () => {
  const siteFiles = [
    ...(await listFiles(path.join(repoRoot, "src"))),
    ...(await listFiles(path.join(repoRoot, "public"))),
    path.join(repoRoot, "astro.config.mjs"),
  ];

  for (const file of siteFiles) {
    if (/\.(png|jpe?g|gif|webp|pdf|woff2?|ttf|ico|mp3|svg)$/i.test(file)) continue;
    const text = await readFile(file, "utf8");
    for (const marker of WRITER_MARKERS) {
      assert.equal(
        text.includes(marker),
        false,
        `${path.relative(repoRoot, file)} mentions ${marker}`
      );
    }
  }
});

test("npm run write starts the local writer script", async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));

  assert.equal(packageJson.scripts.write, "node scripts/write.mjs");
});
