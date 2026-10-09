import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const markdownRoutes = [
  "src/pages/about.md.ts",
  "src/pages/archives.md.ts",
  "src/pages/index.md.ts",
  "src/pages/posts.md.ts",
  "src/pages/posts/[...slug].md.ts",
];

test("markdownResponse serves its body as markdown with the one-hour cache policy", async () => {
  const { markdownResponse } = await import("../src/utils/markdownResponse.ts");
  const response = markdownResponse("# Hello\n");

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(await response.text(), "# Hello\n");
});

test("markdown routes build their responses through the shared markdownResponse helper", () => {
  for (const route of markdownRoutes) {
    const source = readFileSync(new URL(`../${route}`, import.meta.url), "utf8");

    assert.match(
      source,
      /import \{ markdownResponse \} from "[^"]*utils\/markdownResponse\.ts";/,
      route
    );
    assert.doesNotMatch(source, /Cache-Control|text\/markdown/, route);
  }
});
