import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

async function loadDevelopmentPostFilter() {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "post-filter-development-env",
        enforce: "pre",
        transform(code, id) {
          if (!id.endsWith("/src/features/blog/utils/postFilter.ts")) return undefined;
          return code.replace("import.meta.env?.DEV ?? false", "true");
        },
      },
    ],
  });

  try {
    return {
      module: await server.ssrLoadModule("/src/features/blog/utils/postFilter.ts"),
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

test("post visibility uses the development environment default when no option is supplied", async () => {
  const { close, module } = await loadDevelopmentPostFilter();

  try {
    assert.equal(
      module.isPostVisible({
        pubDatetime: "2099-01-01T00:00:00.000Z",
        draft: false,
        unlisted: false,
        tags: ["Post"],
      }),
      true
    );
  } finally {
    await close();
  }
});
