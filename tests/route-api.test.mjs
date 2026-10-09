import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import test, { mock } from "node:test";
import { SITE, SOCIALS } from "../src/site-config.js";
import { astroContentStubPlugin, loadSourceModule } from "./helpers/vite-source-modules.mjs";

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

test("the about markdown endpoint serves its source regardless of the working directory", async () => {
  const { GET } = await import("../src/pages/about.md.ts");
  const originalCwd = process.cwd();
  process.chdir(tmpdir());

  try {
    const response = await GET();

    assert.equal(response.status, 200);
    assert.match(await response.text(), /^---/);
  } finally {
    process.chdir(originalCwd);
  }
});

test("the about markdown endpoint logs a read failure before returning 404", async () => {
  const { createAboutMarkdownResponse } = await import("../src/pages/about.md.ts");
  const logged = mock.method(console, "error", () => {});
  const failure = new Error("missing about source");

  try {
    const response = createAboutMarkdownResponse(() => {
      throw failure;
    });

    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Not found");
    assert.equal(logged.mock.callCount(), 1);
    assert.equal(logged.mock.calls[0].arguments.at(-1), failure);
  } finally {
    logged.mock.restore();
  }
});

test("the about markdown endpoint rejects an undecoded source buffer", async () => {
  const { createAboutMarkdownResponse } = await import("../src/pages/about.md.ts");
  const logged = mock.method(console, "error", () => {});

  try {
    const response = createAboutMarkdownResponse(() => Buffer.from("about source"));

    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Not found");
    assert.equal(logged.mock.callCount(), 1);
  } finally {
    logged.mock.restore();
  }
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
  const { close, modules } = await loadSourceModule(
    {
      indexRoute: "/src/pages/posts/[...slug]/index.png.ts",
      ogRoute: "/src/pages/posts/[...slug]/og.png.ts",
    },
    {
      plugins: [
        astroContentStubPlugin(`globalThis.__dynamicImageCollectionCalls = [];
          export async function getCollection(...args) {
            globalThis.__dynamicImageCollectionCalls.push(args);
            const [, filter] = args;
            const posts = ${JSON.stringify(dynamicImagePosts)};
            return filter ? posts.filter(filter) : posts;
          }`),
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

            return `globalThis.__dynamicOgImagePosts = [];
          export async function generateOgImageForPost(post) {
            globalThis.__dynamicOgImagePosts.push(post);
            return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
          }`;
          },
        },
      ],
    }
  );

  return {
    ...modules,
    collectionCalls: () => globalThis.__dynamicImageCollectionCalls,
    ogImagePosts: () => globalThis.__dynamicOgImagePosts,
    siteConfig: () => globalThis.__dynamicSiteConfig,
    close,
  };
}

test("dynamic image routes enumerate posts and render PNG responses", async () => {
  const { close, collectionCalls, indexRoute, ogRoute, ogImagePosts, siteConfig } =
    await loadDynamicImageRoutes();
  const props = { post: testPost };

  try {
    const expectedPaths = [
      {
        params: { slug: "quality-route-test" },
        props: { post: testPost },
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
    assert.deepEqual(ogImagePosts(), [testPost, testPost]);

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
  const { close, modules } = await loadSourceModule(
    {
      indexRoute: "/src/pages/index.md.ts",
      postsRoute: "/src/pages/posts.md.ts",
      archivesRoute: "/src/pages/archives.md.ts",
      postRoute: "/src/pages/posts/[...slug].md.ts",
      robotsRoute: "/src/pages/robots.txt.ts",
      rssRoute: "/src/pages/rss.xml.ts",
    },
    {
      plugins: [
        astroContentStubPlugin(`globalThis.__markdownCollectionCalls = [];
          export async function getCollection(...args) {
            globalThis.__markdownCollectionCalls.push(args);
            return ${JSON.stringify([testPost])};
          }`),
      ],
    }
  );

  return {
    ...modules,
    collectionCalls: () => globalThis.__markdownCollectionCalls,
    close,
  };
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
    assert.equal(archivesResponse.status, 404);
    assert.equal(await archivesResponse.text(), "Not found");

    assert.deepEqual(await postRoute.getStaticPaths(), [
      { params: { slug: "quality-route-test" }, props: { post: testPost } },
    ]);
    const postPathFilter = collectionCalls()[1][1];
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
      ["blog", "blog", "blog"]
    );
  } finally {
    await close();
  }
});

function siteConfigStubPlugin(showArchives) {
  const stubId = "\0site-config-markdown-test-stub";

  return {
    name: "site-config-markdown-test-stub",
    enforce: "pre",
    resolveId(id) {
      return id === "@/site-config.js" || id.endsWith("/src/site-config.js") ? stubId : undefined;
    },
    load(id) {
      if (id !== stubId) return undefined;

      return `export const SITE = ${JSON.stringify({ ...SITE, showArchives })};
        export const SOCIALS = ${JSON.stringify(SOCIALS)};`;
    },
  };
}

async function loadSiteMarkdownRoutes(showArchives) {
  const { close, modules } = await loadSourceModule(
    {
      indexRoute: "/src/pages/index.md.ts",
      archivesRoute: "/src/pages/archives.md.ts",
    },
    {
      plugins: [
        astroContentStubPlugin(`export async function getCollection() {
          return ${JSON.stringify([testPost])};
        }`),
        siteConfigStubPlugin(showArchives),
      ],
    }
  );

  return { ...modules, close };
}

test("the index markdown endpoint builds its identity and links from site-config", async () => {
  const { indexRoute, close } = await loadSiteMarkdownRoutes(false);

  try {
    const body = await (await indexRoute.GET()).text();

    assert.ok(body.startsWith(`# ${SITE.title}\n`));
    assert.ok(body.includes(`\n${SITE.desc}\n`));
    for (const social of SOCIALS.filter((entry) => entry.active)) {
      assert.ok(body.includes(`- [${social.name}](${social.href})`), social.name);
    }
    assert.match(body, /\[Email\]\(mailto:noeflandre@gmail\.com\)/);
    assert.doesNotMatch(body, /noe\.flandre@gmail\.com/);
    assert.doesNotMatch(body, /\/archives\.md/);
  } finally {
    await close();
  }
});

test("archives markdown and its index link follow the showArchives flag", async () => {
  const hidden = await loadSiteMarkdownRoutes(false);
  try {
    const hiddenArchives = await hidden.archivesRoute.GET();
    assert.equal(hiddenArchives.status, 404);
    assert.equal(await hiddenArchives.text(), "Not found");
  } finally {
    await hidden.close();
  }

  const shown = await loadSiteMarkdownRoutes(true);
  try {
    assert.match(await (await shown.indexRoute.GET()).text(), /- \[Archives\]\(\/archives\.md\)/);
    const shownArchives = await shown.archivesRoute.GET();
    assert.equal(shownArchives.status, 200);
    assert.match(await shownArchives.text(), /Total posts: 1/);
  } finally {
    await shown.close();
  }
});
