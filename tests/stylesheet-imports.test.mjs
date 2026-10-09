import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const srcUrl = new URL("../src/", import.meta.url);

test("every stylesheet in src/styles is imported by the site source", () => {
  const stylesheets = readdirSync(new URL("styles/", srcUrl)).filter((file) =>
    file.endsWith(".css")
  );
  const sources = readdirSync(srcUrl, { recursive: true })
    .filter((file) => /\.(astro|css|js|mjs|ts|tsx)$/.test(file))
    .map((file) => ({ file, text: readFileSync(new URL(file, srcUrl), "utf8") }));

  const unimported = stylesheets.filter((stylesheet) => {
    const importPattern = new RegExp(`["'][^"']*${stylesheet.replaceAll(".", "\\.")}["']`);
    return !sources.some(
      ({ file, text }) => file !== join("styles", stylesheet) && importPattern.test(text)
    );
  });

  assert.deepEqual(unimported, []);
});
