import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createWriterServer } from "../scripts/write/server.mjs";

const EDITOR_PAGE = new URL("../scripts/write/index.html", import.meta.url).pathname;

async function startFixture() {
  const base = await mkdtemp(path.join(tmpdir(), "writer-server-"));
  const root = path.join(base, "blog");
  const publicDir = path.join(base, "public");
  const distDir = path.join(base, "dist");

  await mkdir(path.join(root, "2026"), { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await mkdir(path.join(distDir, "_astro"), { recursive: true });
  await writeFile(
    path.join(root, "2026", "post.md"),
    '---\ntitle: "Post"\npubDatetime: 2026-01-02\n---\n\n## Hi\n'
  );
  await writeFile(path.join(publicDir, "pic.txt"), "public file");
  await writeFile(
    path.join(distDir, "index.html"),
    '<link rel="stylesheet" href="/_astro/site.css">'
  );
  await writeFile(path.join(distDir, "_astro", "site.css"), "body{}");

  const server = createWriterServer({ root, publicDir, distDir, indexHtmlPath: EDITOR_PAGE });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  return {
    server,
    base,
    root,
    origin: `http://127.0.0.1:${port}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await rm(base, { recursive: true, force: true });
    },
  };
}

function api(origin, pathname, { method = "GET", body, headers = {} } = {}) {
  return fetch(origin + pathname, {
    method,
    headers: {
      "x-writer": "1",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function rawRequest(port, { host }) {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, path: "/api/posts", headers: { host, "x-writer": "1" } },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on("error", reject);
    req.end();
  });
}

test("the server listens on loopback only", async () => {
  const fixture = await startFixture();
  try {
    assert.equal(fixture.server.address().address, "127.0.0.1");
  } finally {
    await fixture.close();
  }
});

test("GET / serves the editor page", async () => {
  const fixture = await startFixture();
  try {
    const response = await fetch(fixture.origin + "/");
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(html, /<textarea id="editor"/);
    assert.match(html, /<iframe id="preview"/);
  } finally {
    await fixture.close();
  }
});

test("API calls without the writer header are refused", async () => {
  const fixture = await startFixture();
  try {
    const response = await fetch(fixture.origin + "/api/posts");
    assert.equal(response.status, 403);
  } finally {
    await fixture.close();
  }
});

test("foreign Host headers and cross-site origins are refused", async () => {
  const fixture = await startFixture();
  try {
    const port = fixture.server.address().port;
    assert.equal(await rawRequest(port, { host: "evil.example" }), 403);

    const response = await api(fixture.origin, "/api/post", {
      method: "POST",
      body: { path: "2026/post.md", content: "pwned" },
      headers: { origin: "https://evil.example" },
    });
    assert.equal(response.status, 403);
    const text = await readFile(path.join(fixture.root, "2026", "post.md"), "utf8");
    assert.doesNotMatch(text, /pwned/);
  } finally {
    await fixture.close();
  }
});

test("GET /api/posts lists the blog posts", async () => {
  const fixture = await startFixture();
  try {
    const response = await api(fixture.origin, "/api/posts");
    const posts = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(
      posts.map((post) => post.path),
      ["2026/post.md"]
    );
    assert.equal(posts[0].title, "Post");
  } finally {
    await fixture.close();
  }
});

test("POST /api/post saves markdown that GET /api/post reads back", async () => {
  const fixture = await startFixture();
  try {
    const content = '---\ntitle: "Post"\n---\n\nUpdated body\n';
    const saved = await api(fixture.origin, "/api/post", {
      method: "POST",
      body: { path: "2026/post.md", content },
    });
    assert.equal(saved.status, 200);

    const read = await api(fixture.origin, "/api/post?path=2026%2Fpost.md");
    assert.deepEqual(await read.json(), { path: "2026/post.md", content });
  } finally {
    await fixture.close();
  }
});

test("saving outside the blog folder is refused and writes nothing", async () => {
  const fixture = await startFixture();
  try {
    const response = await api(fixture.origin, "/api/post", {
      method: "POST",
      body: { path: "../escaped.md", content: "x" },
    });
    assert.equal(response.status, 400);
    await assert.rejects(readFile(path.join(fixture.base, "escaped.md"), "utf8"));
  } finally {
    await fixture.close();
  }
});

test("POST /api/posts creates a draft scaffold and refuses to overwrite it", async () => {
  const fixture = await startFixture();
  try {
    const created = await api(fixture.origin, "/api/posts", {
      method: "POST",
      body: { title: "Fresh idea" },
    });
    assert.equal(created.status, 201);
    const { path: postPath } = await created.json();
    assert.match(postPath, /^\d{4}\/fresh-idea\.md$/);
    assert.match(await readFile(path.join(fixture.root, postPath), "utf8"), /draft: true/);

    const again = await api(fixture.origin, "/api/posts", {
      method: "POST",
      body: { title: "Fresh idea" },
    });
    assert.equal(again.status, 409);
  } finally {
    await fixture.close();
  }
});

test("POST /api/render returns a styled preview document", async () => {
  const fixture = await startFixture();
  try {
    const response = await api(fixture.origin, "/api/render", {
      method: "POST",
      body: { markdown: '---\ntitle: "Preview"\n---\n\n## Heading\n' },
    });
    const { html, styled } = await response.json();

    assert.equal(response.status, 200);
    assert.equal(styled, true);
    assert.match(html, /<h2[^>]*>Heading<\/h2>/);
    assert.match(html, /href="\/_astro\/site\.css"/);
  } finally {
    await fixture.close();
  }
});

test("static files come from public/ and cannot escape it", async () => {
  const fixture = await startFixture();
  try {
    const file = await fetch(fixture.origin + "/pic.txt");
    assert.equal(file.status, 200);
    assert.equal(await file.text(), "public file");

    const escaped = await fetch(fixture.origin + "/%2e%2e/%2e%2e/package.json");
    assert.equal(escaped.status, 404);
  } finally {
    await fixture.close();
  }
});

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);

test("POST /api/upload stores an image next to the post and returns its URL", async () => {
  const fixture = await startFixture();
  try {
    const response = await fetch(
      `${fixture.origin}/api/upload?postPath=${encodeURIComponent("2026/post.md")}&filename=Hero%20Shot.png`,
      { method: "POST", headers: { "x-writer": "1", "content-type": "image/png" }, body: PNG_BYTES }
    );
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(body, {
      name: "hero-shot.png",
      kind: "image",
      url: "/assets/img/2026/post/hero-shot.png",
    });
    const onDisk = await readFile(
      path.join(fixture.base, "public", "assets", "img", "2026", "post", "hero-shot.png")
    );
    assert.ok(onDisk.equals(PNG_BYTES));
  } finally {
    await fixture.close();
  }
});

test("uploads without the writer header are refused", async () => {
  const fixture = await startFixture();
  try {
    const response = await fetch(
      `${fixture.origin}/api/upload?postPath=2026%2Fpost.md&filename=a.png`,
      {
        method: "POST",
        body: PNG_BYTES,
      }
    );
    assert.equal(response.status, 403);
  } finally {
    await fixture.close();
  }
});

test("GET /api/media lists the uploads for a post", async () => {
  const fixture = await startFixture();
  try {
    await fetch(`${fixture.origin}/api/upload?postPath=2026%2Fpost.md&filename=one.png`, {
      method: "POST",
      headers: { "x-writer": "1" },
      body: PNG_BYTES,
    });
    const response = await api(fixture.origin, "/api/media?path=2026%2Fpost.md");

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [
      { name: "one.png", kind: "image", url: "/assets/img/2026/post/one.png" },
    ]);
  } finally {
    await fixture.close();
  }
});

test("POST /api/hero returns the post with its hero image set", async () => {
  const fixture = await startFixture();
  try {
    const response = await api(fixture.origin, "/api/hero", {
      method: "POST",
      body: {
        content: '---\ntitle: "Post"\n---\n\nBody\n',
        url: "/assets/img/2026/post/hero.png",
        alt: "Hero",
      },
    });
    const { content } = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      content,
      '---\ntitle: "Post"\nheroImage: "/assets/img/2026/post/hero.png"\nheroImageAlt: "Hero"\n---\n\nBody\n'
    );
  } finally {
    await fixture.close();
  }
});

test("the preview shows the hero image above the post body", async () => {
  const fixture = await startFixture();
  try {
    const response = await api(fixture.origin, "/api/render", {
      method: "POST",
      body: {
        markdown:
          '---\ntitle: "Hero post"\nheroImage: "/assets/img/x.png"\nheroImageAlt: "A chart"\n---\n\nBody text\n',
      },
    });
    const { html } = await response.json();

    assert.match(html, /<img src="\/assets\/img\/x\.png" alt="A chart"/);
    assert.ok(html.indexOf("<img src=") < html.indexOf("Body text"));
  } finally {
    await fixture.close();
  }
});
