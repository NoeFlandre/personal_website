import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

async function loadReadingTime() {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "astro-content-reading-time-stub",
        enforce: "pre",
        resolveId(id) {
          return id === "astro:content" ? "\0astro-content-reading-time-stub" : undefined;
        },
        load(id) {
          if (id !== "\0astro-content-reading-time-stub") return undefined;

          return `export async function getCollection() {
            return [{ id: "known", body: "one two three four five six" }];
          }`;
        },
      },
    ],
  });

  try {
    return {
      module: await server.ssrLoadModule("/src/features/blog/utils/readingTime.ts"),
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

test("reading time helpers calculate and fall back consistently", async () => {
  const { close, module } = await loadReadingTime();

  try {
    assert.equal(module.calculateReadingTime("one two three four five six"), "1 min read");
    assert.equal(module.getReadingTimeForPost({ body: "one two three" }), "1 min read");
    assert.equal(module.getReadingTimeForPost(undefined), "5 min read");
    assert.equal(await module.getReadingTime("known"), "1 min read");
    assert.equal(await module.getReadingTime("missing"), "5 min read");

    const calls = [];
    assert.equal(
      await module.getReadingTime("target", async (collection) => {
        calls.push(collection);
        return [{ id: "target", body: "one two three four five" }];
      }),
      "1 min read"
    );
    assert.deepEqual(calls, ["blog"]);
  } finally {
    await close();
  }
});
