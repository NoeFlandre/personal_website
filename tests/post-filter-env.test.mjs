import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

async function loadPostFilterWithDevFlag(devFlag, expression = "import.meta.env?.DEV ?? false") {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "post-filter-development-env",
        enforce: "pre",
        transform(code, id) {
          if (!id.endsWith("/src/features/blog/utils/postFilter.ts")) return undefined;
          if (!code.includes(expression)) {
            throw new Error(`expected "${expression}" in postFilter.ts`);
          }
          return code.replace(expression, devFlag);
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
  const { close, module } = await loadPostFilterWithDevFlag("true");

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

test("post visibility hides future posts in production when no option is supplied", async () => {
  const { close, module } = await loadPostFilterWithDevFlag("false");

  try {
    assert.equal(
      module.isPostVisible({
        pubDatetime: "2099-01-01T00:00:00.000Z",
        draft: false,
        unlisted: false,
        tags: ["Post"],
      }),
      false
    );
  } finally {
    await close();
  }
});

test("loading fails when the development flag expression is missing from the source", async () => {
  let loaded;

  try {
    loaded = await loadPostFilterWithDevFlag("true", "import.meta.env?.DEV ?? true");
  } catch (error) {
    assert.match(error.message, /import\.meta\.env\?\.DEV \?\? true/);
    return;
  }

  await loaded.close();
  assert.fail("expected loading to reject when the flag expression is missing");
});
