import assert from "node:assert/strict";
import test from "node:test";
import { astroContentStubPlugin, loadSourceModule } from "./helpers/vite-source-modules.mjs";

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
    refine(check, options) {
      return schemaNode("refine", { inner: this, check, options });
    },
  };
}

async function loadContentConfig() {
  const { close, modules } = await loadSourceModule(
    { contentConfig: "/src/content.config.ts" },
    {
      ssr: { noExternal: ["astro"] },
      plugins: [
        astroContentStubPlugin(`
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
            `),
        {
          name: "content-config-astro-loaders-stub",
          enforce: "pre",
          resolveId(id) {
            return id === "astro/loaders" ? "\0astro-loaders-config" : undefined;
          },
          load(id) {
            if (id !== "\0astro-loaders-config") return undefined;
            return `export const glob = (options) => ({ kind: "glob", ...options });`;
          },
        },
      ],
    }
  );

  return { module: modules.contentConfig, close };
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

test("content configuration only accepts post timezones that Intl can resolve", async () => {
  const { close, module } = await loadContentConfig();

  try {
    const schema = module.collections.blog.schema({ image: () => schemaNode("image") });
    const timezone = schema.shape.timezone;
    assert.equal(timezone.kind, "optional");
    assert.equal(timezone.inner.kind, "refine");
    assert.equal(timezone.inner.inner.kind, "string");

    const isAccepted = timezone.inner.check;
    assert.equal(isAccepted("America/Los_Angeles"), true);
    assert.equal(isAccepted("Europe/Paris"), true);
    assert.equal(isAccepted("Mars/Olympus"), false);
    assert.equal(isAccepted("America/Los_Angelse"), false);
    assert.equal(isAccepted(""), true);
    assert.deepEqual(timezone.inner.options, { message: "Invalid IANA time zone" });
  } finally {
    await close();
  }
});
