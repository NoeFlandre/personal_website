import assert from "node:assert/strict";
import test from "node:test";
import { astroContentStubPlugin, loadSourceModule } from "./helpers/vite-source-modules.mjs";

const posts = [
  {
    id: "2026-08-18-first-post",
    filePath: "src/content/blog/first-post.md",
    body: "First post.",
    data: { title: "First", draft: false },
  },
  {
    id: "2026-08-19-draft-post",
    filePath: "src/content/blog/draft-post.md",
    body: "Draft post.",
    data: { title: "Draft", draft: true },
  },
  {
    id: "2026-08-20-third-post",
    filePath: "src/content/blog/third-post.md",
    body: "Third post.",
    data: { title: "Third", draft: false },
  },
];

async function loadPostStaticPaths() {
  const { close, modules } = await loadSourceModule(
    {
      postStaticPaths: "/src/features/blog/utils/postStaticPaths.ts",
      staticPaths: "/src/features/blog/utils/staticPaths.ts",
    },
    {
      plugins: [
        astroContentStubPlugin(`globalThis.__postStaticPathsCalls = [];
          const posts = ${JSON.stringify(posts)};
          export async function getCollection(...args) {
            globalThis.__postStaticPathsCalls.push(args);
            return posts.filter(args[1] ?? (() => true));
          }`),
      ],
    }
  );

  return {
    ...modules,
    close,
    collectionCalls: () => globalThis.__postStaticPathsCalls,
  };
}

test("getPostStaticPaths asks the blog collection with the filter and maps each post to params and props", async () => {
  const { close, collectionCalls, postStaticPaths, staticPaths } = await loadPostStaticPaths();

  try {
    const isPublished = ({ data }) => !data.draft;
    const paths = await postStaticPaths.getPostStaticPaths(isPublished);

    assert.deepEqual(collectionCalls(), [["blog", isPublished]]);
    assert.deepEqual(paths, [
      {
        params: staticPaths.getPostStaticPathParams(posts[0]),
        props: { post: posts[0] },
      },
      {
        params: staticPaths.getPostStaticPathParams(posts[2]),
        props: { post: posts[2] },
      },
    ]);
  } finally {
    await close();
  }
});

test("getPostStaticPaths returns no paths when the filter rejects every post", async () => {
  const { close, postStaticPaths } = await loadPostStaticPaths();

  try {
    assert.deepEqual(await postStaticPaths.getPostStaticPaths(() => false), []);
  } finally {
    await close();
  }
});
