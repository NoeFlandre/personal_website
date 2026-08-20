import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { SITE } from "../src/site-config.js";

const testPost = {
  id: "2026-08-18-quality-route-test",
  filePath: "src/content/blog/quality-route-test.md",
  body: "A small route test post.",
  data: {
    title: "Quality route test",
    description: "A route test post.",
    author: "Noé Flandre",
    pubDatetime: "2026-08-18T12:00:00.000Z",
    modDatetime: null,
    draft: false,
    unlisted: false,
    tags: ["Post"],
    ogImage: null,
  },
};

test("the about markdown endpoint serves the source with cache headers", async () => {
  const { GET } = await import("../src/pages/about.md.ts");
  const response = await GET();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.match(await response.text(), /^---/);
});

test("the about markdown endpoint returns a precise 404 when its source is unavailable", async () => {
  const { createAboutMarkdownResponse } = await import("../src/pages/about.md.ts");
  const response = createAboutMarkdownResponse(() => {
    throw new Error("missing about source");
  });

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found");
});

test("the about markdown endpoint rejects an undecoded source buffer", async () => {
  const { createAboutMarkdownResponse } = await import("../src/pages/about.md.ts");
  const response = createAboutMarkdownResponse(() => Buffer.from("about source"));

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found");
});

async function loadDynamicImageRoutes() {
  const dynamicImagePosts = [
    testPost,
    {
      ...testPost,
      id: "2026-08-18-quality-route-with-og-image",
      data: { ...testPost.data, ogImage: "custom-og.png" },
    },
  ];
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, ws: false },
    resolve: {
      alias: { "@": new URL("../src", import.meta.url).pathname },
    },
    plugins: [
      {
        name: "astro-content-test-stub",
        enforce: "pre",
        resolveId(id) {
          return id === "astro:content" ? "\0astro-content-test-stub" : undefined;
        },
        load(id) {
          if (id === "\0astro-content-test-stub") {
            return `globalThis.__dynamicImageCollectionCalls = [];
            export async function getCollection(...args) {
              globalThis.__dynamicImageCollectionCalls.push(args);
              return ${JSON.stringify(dynamicImagePosts)};
            }`;
          }
          return undefined;
        },
      },
      {
        name: "site-config-test-stub",
        enforce: "pre",
        resolveId(id) {
          return id === "@/site-config.js" || id.endsWith("/src/site-config.js")
            ? "\0site-config-test-stub"
            : undefined;
        },
        load(id) {
          if (id !== "\0site-config-test-stub") return undefined;
          return `globalThis.__dynamicSiteConfig = ${JSON.stringify(SITE)};
          export const SITE = globalThis.__dynamicSiteConfig;`;
        },
      },
      {
        name: "og-image-test-stub",
        enforce: "pre",
        resolveId(id) {
          return id.endsWith("/src/features/blog/og/generateOgImages")
            ? "\0og-image-test-stub"
            : undefined;
        },
        load(id) {
          if (id !== "\0og-image-test-stub") return undefined;

          return `export async function generateOgImageForPost() {
            return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
          }`;
        },
      },
    ],
  });

  try {
    return {
      indexRoute: await server.ssrLoadModule("/src/pages/posts/[...slug]/index.png.ts"),
      ogRoute: await server.ssrLoadModule("/src/pages/posts/[...slug]/og.png.ts"),
      collectionCalls: () => globalThis.__dynamicImageCollectionCalls,
      siteConfig: () => globalThis.__dynamicSiteConfig,
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

test("dynamic image routes enumerate posts and render PNG responses", async () => {
  const { close, collectionCalls, indexRoute, ogRoute, siteConfig } =
    await loadDynamicImageRoutes();
  const props = { data: { title: "Quality route test", author: "Noé Flandre" } };

  try {
    const expectedPaths = [
      {
        params: { slug: "quality-route-test" },
        props: testPost,
      },
    ];
    assert.deepEqual(await indexRoute.getStaticPaths(), expectedPaths);
    assert.deepEqual(await ogRoute.getStaticPaths(), expectedPaths);
    assert.deepEqual(
      collectionCalls().map(([name]) => name),
      ["blog", "blog"]
    );

    for (const route of [indexRoute, ogRoute]) {
      const response = await route.GET({ props });
      const bytes = await response.arrayBuffer();

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/png");
      assert.deepEqual([...new Uint8Array(bytes).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    }

    const dynamicSiteConfig = siteConfig();
    const previousDynamicOgImage = dynamicSiteConfig.dynamicOgImage;
    dynamicSiteConfig.dynamicOgImage = false;
    try {
      for (const route of [indexRoute, ogRoute]) {
        assert.deepEqual(await route.getStaticPaths(), []);
        const response = await route.GET({ props });
        assert.equal(response.status, 404);
        assert.equal(response.statusText, "Not found");
      }
    } finally {
      dynamicSiteConfig.dynamicOgImage = previousDynamicOgImage;
    }
  } finally {
    await close();
  }
});

async function loadMarkdownRoutes() {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, ws: false },
    resolve: {
      alias: { "@": new URL("../src", import.meta.url).pathname },
    },
    plugins: [
      {
        name: "astro-content-test-stub",
        enforce: "pre",
        resolveId(id) {
          return id === "astro:content" ? "\0astro-content-test-stub" : undefined;
        },
        load(id) {
          if (id !== "\0astro-content-test-stub") return undefined;

          return `globalThis.__markdownCollectionCalls = [];
          export async function getCollection(...args) {
            globalThis.__markdownCollectionCalls.push(args);
            return ${JSON.stringify([testPost])};
          }`;
        },
      },
    ],
  });

  try {
    return {
      indexRoute: await server.ssrLoadModule("/src/pages/index.md.ts"),
      postsRoute: await server.ssrLoadModule("/src/pages/posts.md.ts"),
      archivesRoute: await server.ssrLoadModule("/src/pages/archives.md.ts"),
      postRoute: await server.ssrLoadModule("/src/pages/posts/[...slug].md.ts"),
      robotsRoute: await server.ssrLoadModule("/src/pages/robots.txt.ts"),
      rssRoute: await server.ssrLoadModule("/src/pages/rss.xml.ts"),
      collectionCalls: () => globalThis.__markdownCollectionCalls,
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

test("markdown and feed routes return their generated content", async () => {
  const {
    close,
    collectionCalls,
    indexRoute,
    postsRoute,
    archivesRoute,
    postRoute,
    robotsRoute,
    rssRoute,
  } = await loadMarkdownRoutes();

  try {
    const indexResponse = await indexRoute.GET();
    assert.equal(indexResponse.status, 200);
    assert.equal(indexResponse.headers.get("content-type"), "text/markdown; charset=utf-8");
    assert.equal(indexResponse.headers.get("cache-control"), "public, max-age=3600");
    assert.match(await indexResponse.text(), /Noé Flandre/);

    const postsResponse = await postsRoute.GET();
    assert.equal(postsResponse.status, 200);
    assert.equal(postsResponse.headers.get("content-type"), "text/markdown; charset=utf-8");
    assert.equal(postsResponse.headers.get("cache-control"), "public, max-age=3600");
    assert.match(await postsResponse.text(), /Quality route test/);

    const archivesResponse = await archivesRoute.GET();
    assert.equal(archivesResponse.status, 200);
    assert.equal(archivesResponse.headers.get("content-type"), "text/markdown; charset=utf-8");
    assert.equal(archivesResponse.headers.get("cache-control"), "public, max-age=3600");
    assert.match(await archivesResponse.text(), /Total posts: 1/);

    assert.deepEqual(await postRoute.getStaticPaths(), [
      { params: { slug: "quality-route-test" }, props: { post: testPost } },
    ]);
    const postPathFilter = collectionCalls()[2][1];
    assert.equal(
      postPathFilter({ data: { ...testPost.data, draft: true, unlisted: false } }),
      false
    );
    const postResponse = await postRoute.GET({ props: { post: testPost } });
    assert.equal(postResponse.status, 200);
    assert.equal(postResponse.headers.get("content-type"), "text/markdown; charset=utf-8");
    assert.equal(postResponse.headers.get("cache-control"), "public, max-age=3600");
    assert.equal(await postResponse.text(), testPost.body);

    const robotsResponse = await robotsRoute.GET({ site: new URL("https://example.com/") });
    assert.equal(robotsResponse.status, 200);
    assert.match(
      await robotsResponse.text(),
      /Sitemap: https:\/\/example\.com\/sitemap-index\.xml/
    );

    const rssResponse = await rssRoute.GET();
    assert.equal(rssResponse.status, 200);
    assert.equal(rssResponse.headers.get("content-type"), "application/xml");
    const rssText = await rssResponse.text();
    assert.match(rssText, /Quality route test/);
    assert.match(rssText, /2026/);
    assert.deepEqual(
      collectionCalls().map(([name]) => name),
      ["blog", "blog", "blog", "blog"]
    );
  } finally {
    await close();
  }
});
