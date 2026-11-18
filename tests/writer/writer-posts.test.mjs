import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertPostFilePath,
  createPost,
  listPosts,
  readPost,
  resolvePostPath,
  slugify,
  splitFrontmatter,
  WriterError,
  writePost,
} from "../../scripts/write/posts.mjs";

async function makeBlogRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "writer-posts-"));
  await mkdir(path.join(root, "2026"), { recursive: true });
  await mkdir(path.join(root, "2025"), { recursive: true });
  await writeFile(
    path.join(root, "2026", "newer.md"),
    '---\ntitle: "Newer post"\npubDatetime: 2026-03-01\ndraft: false\n---\n\nBody\n'
  );
  await writeFile(
    path.join(root, "2025", "older.md"),
    '---\ntitle: "Older post"\npubDatetime: 2025-05-01\ndraft: true\n---\n\nOld\n'
  );
  await writeFile(path.join(root, "_ignored.md"), "---\ntitle: Ignored\n---\n");
  await writeFile(path.join(root, "notes.txt"), "not a post");
  return root;
}

async function expectWriterError(promise, status) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof WriterError, `expected WriterError, got ${error}`);
    assert.equal(error.status, status);
    return true;
  });
}

test("resolvePostPath accepts markdown files inside the blog folder", () => {
  const root = path.join(tmpdir(), "blog-root");
  const resolved = resolvePostPath(root, "2026/my-post.md");

  assert.equal(resolved.path, "2026/my-post.md");
  assert.equal(resolved.full, path.join(root, "2026", "my-post.md"));
});

test("resolvePostPath rejects paths that escape the blog folder or are not markdown", () => {
  const root = path.join(tmpdir(), "blog-root");

  for (const bad of [
    "../secret.md",
    "2026/../../secret.md",
    "/etc/passwd.md",
    "",
    "2026/post.txt",
    ".",
  ]) {
    assert.throws(
      () => resolvePostPath(root, bad),
      (error) => {
        assert.ok(error instanceof WriterError, `${bad} should be a WriterError`);
        assert.equal(error.status, 400);
        return true;
      }
    );
  }
});

test("listPosts returns markdown posts newest first and skips ignored files", async () => {
  const root = await makeBlogRoot();
  try {
    const posts = await listPosts(root);

    assert.deepEqual(
      posts.map(({ path: postPath, title, draft }) => ({ path: postPath, title, draft })),
      [
        { path: "2026/newer.md", title: "Newer post", draft: false },
        { path: "2025/older.md", title: "Older post", draft: true },
      ]
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("readPost and writePost round-trip content and refuse to create new files", async () => {
  const root = await makeBlogRoot();
  try {
    const before = await readPost(root, "2026/newer.md");
    assert.match(before.content, /^---\ntitle: "Newer post"/);

    await writePost(root, "2026/newer.md", "---\ntitle: Edited\n---\n\nNew body\n");
    assert.equal(
      await readFile(path.join(root, "2026", "newer.md"), "utf8"),
      "---\ntitle: Edited\n---\n\nNew body\n"
    );

    await expectWriterError(writePost(root, "2026/missing.md", "x"), 404);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("createPost scaffolds a draft in the current year and refuses duplicates", async () => {
  const root = await makeBlogRoot();
  try {
    const now = new Date(2026, 10, 14, 9, 30);
    const created = await createPost(root, { title: "My First Idea!", now });

    assert.equal(created.path, "2026/my-first-idea.md");
    assert.equal(
      await readFile(path.join(root, "2026", "my-first-idea.md"), "utf8"),
      [
        "---",
        'title: "My First Idea!"',
        'description: "TBD"',
        "pubDatetime: 2026-11-14",
        "draft: true",
        "---",
        "",
      ].join("\n")
    );

    await expectWriterError(createPost(root, { title: "My First Idea!", now }), 409);
    await expectWriterError(createPost(root, { title: "   ", now }), 400);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("slugify makes short lowercase file names", () => {
  assert.equal(slugify("What is OpenStreetMap? (2026)"), "what-is-openstreetmap-2026");
  assert.equal(slugify("  Hello,   world  "), "hello-world");
  assert.equal(slugify("!!!"), "");
});

test("splitFrontmatter separates the YAML block from the body", () => {
  assert.deepEqual(splitFrontmatter("---\ntitle: A\n---\n\nHello\n"), {
    frontmatter: "title: A",
    body: "\nHello\n",
  });
  assert.deepEqual(splitFrontmatter("No frontmatter here"), {
    frontmatter: null,
    body: "No frontmatter here",
  });
});

test("assertPostFilePath accepts relative markdown paths and rejects everything else", () => {
  assert.equal(assertPostFilePath("2026/my-post.md"), "2026/my-post.md");

  for (const bad of ["", "   ", "/etc/passwd.md", "2026/post.txt", "post\0.md"]) {
    assert.throws(
      () => assertPostFilePath(bad),
      (error) => {
        assert.ok(error instanceof WriterError, `${JSON.stringify(bad)} should be rejected`);
        assert.equal(error.status, 400);
        return true;
      }
    );
  }
});
