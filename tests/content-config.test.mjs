import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

function schemaNode(kind, details = {}) {
  return {
    kind,
    ...details,
    optional() {
      return schemaNode("optional", { inner: this });
    },
    nullable() {
      return schemaNode("nullable", { inner: this });
    },
    default(value) {
      return schemaNode("default", { inner: this, value });
    },
    length(value) {
      return schemaNode("length", { inner: this, value });
    },
    or(other) {
      return schemaNode("or", { left: this, right: other });
    },
  };
}

async function loadContentConfig() {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    optimizeDeps: { noDiscovery: true },
    ssr: { noExternal: ["astro"] },
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "content-config-astro-stubs",
        enforce: "pre",
        resolveId(id) {
          if (id === "astro:content") return "\0astro-content-config";
          if (id === "astro/loaders") return "\0astro-loaders-config";
          return undefined;
        },
        load(id) {
          if (id === "\0astro-content-config") {
            return `
              const node = ${schemaNode.toString()};
              export const z = {
                object: (shape) => ({ kind: "object", shape }),
                string: () => node("string"),
                date: () => node("date"),
                boolean: () => node("boolean"),
                array: (inner) => node("array", { inner }),
                enum: (values) => node("enum", { values }),
                coerce: { date: () => node("coerce-date") },
              };
              export const defineCollection = (definition) => definition;
            `;
          }
          if (id === "\0astro-loaders-config") {
            return `export const glob = (options) => ({ kind: "glob", ...options });`;
          }
          return undefined;
        },
      },
    ],
    resolve: {
      alias: { "@": new URL("../src", import.meta.url).pathname },
    },
  });

  try {
    return {
      module: await server.ssrLoadModule("/src/content.config.ts"),
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

test("content configuration defines the blog loader and schema contract", async () => {
  const { close, module } = await loadContentConfig();

  try {
    const blog = module.collections.blog;
    assert.deepEqual(blog.loader, {
      kind: "glob",
      pattern: "**/[^_]*.{md,mdx}",
      base: "./src/content/blog",
    });

    const schema = blog.schema({ image: () => schemaNode("image") });
    assert.equal(schema.kind, "object");
    assert.deepEqual(Object.keys(schema.shape), [
      "author",
      "pubDatetime",
      "modDatetime",
      "title",
      "featured",
      "draft",
      "unlisted",
      "tags",
      "ogImage",
      "heroImage",
      "description",
      "canonicalURL",
      "hideEditPost",
      "timezone",
      "source",
      "AIDescription",
      "readingTime",
      "layoutStyle",
    ]);
    assert.equal(schema.shape.author.value, "Noé Flandre");
    assert.equal(schema.shape.draft.value, false);
    assert.equal(schema.shape.unlisted.value, false);
    assert.deepEqual(schema.shape.tags.value, ["Post"]);
    assert.equal(schema.shape.tags.inner.value, 1);
    assert.deepEqual(schema.shape.tags.inner.inner.inner.values, [
      "Publication",
      "Paper Review",
      "Project",
      "Post",
    ]);
  } finally {
    await close();
  }
});
