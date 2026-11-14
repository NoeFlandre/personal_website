import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  listMedia,
  MAX_UPLOAD_BYTES,
  mediaFolderFor,
  sanitizeFilename,
  saveUpload,
  setHeroFields,
} from "../scripts/write/media.mjs";
import { WriterError } from "../scripts/write/posts.mjs";

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const MP4 = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]),
  Buffer.from("ftypmp42"),
  Buffer.alloc(32),
]);
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>'
);

async function makeFixture() {
  const base = await mkdtemp(path.join(tmpdir(), "writer-media-"));
  const root = path.join(base, "blog");
  const publicDir = path.join(base, "public");
  await mkdir(path.join(root, "2026"), { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await writeFile(
    path.join(root, "2026", "attention-pooling.md"),
    '---\ntitle: "Attention"\n---\n\nBody\n'
  );
  return { base, root, publicDir, close: () => rm(base, { recursive: true, force: true }) };
}

async function expectWriterError(promise, status) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof WriterError, `expected WriterError, got ${error}`);
    assert.equal(error.status, status);
    return true;
  });
}

test("uploads go next to the post, using the same folder layout as existing posts", () => {
  assert.equal(mediaFolderFor("2026/attention-pooling.md"), "assets/img/2026/attention-pooling");
  assert.equal(mediaFolderFor("distilling_abms.md"), "assets/img/distilling_abms");
});

test("sanitizeFilename keeps a readable stem and a lowercase extension", () => {
  assert.deepEqual(sanitizeFilename("Screenshot 2026-08-25 at 2.20.14 PM.PNG"), {
    stem: "screenshot-2026-08-25-at-2-20-14-pm",
    ext: ".png",
  });
  assert.deepEqual(sanitizeFilename("../../etc/passwd.jpg"), { stem: "passwd", ext: ".jpg" });
  assert.deepEqual(sanitizeFilename("Café.webp"), { stem: "cafe", ext: ".webp" });
});

test("saveUpload writes an image into the post's folder and returns its URL", async () => {
  const fixture = await makeFixture();
  try {
    const saved = await saveUpload({
      root: fixture.root,
      publicDir: fixture.publicDir,
      postPath: "2026/attention-pooling.md",
      filename: "Hero Shot.png",
      data: PNG,
    });

    assert.deepEqual(saved, {
      name: "hero-shot.png",
      kind: "image",
      url: "/assets/img/2026/attention-pooling/hero-shot.png",
    });
    const written = await readFile(
      path.join(fixture.publicDir, "assets/img/2026/attention-pooling/hero-shot.png")
    );
    assert.ok(written.equals(PNG));
  } finally {
    await fixture.close();
  }
});

test("saveUpload never overwrites an existing file", async () => {
  const fixture = await makeFixture();
  try {
    const args = {
      root: fixture.root,
      publicDir: fixture.publicDir,
      postPath: "2026/attention-pooling.md",
      filename: "chart.png",
      data: PNG,
    };
    const first = await saveUpload(args);
    const second = await saveUpload(args);

    assert.equal(first.name, "chart.png");
    assert.equal(second.name, "chart-2.png");
  } finally {
    await fixture.close();
  }
});

test("saveUpload accepts svg, jpeg, and mp4 with matching content and reports the kind", async () => {
  const fixture = await makeFixture();
  try {
    const base = {
      root: fixture.root,
      publicDir: fixture.publicDir,
      postPath: "2026/attention-pooling.md",
    };
    assert.equal((await saveUpload({ ...base, filename: "diagram.svg", data: SVG })).kind, "image");
    assert.equal((await saveUpload({ ...base, filename: "photo.jpg", data: JPEG })).kind, "image");
    assert.equal((await saveUpload({ ...base, filename: "clip.mp4", data: MP4 })).kind, "video");
  } finally {
    await fixture.close();
  }
});

test("saveUpload refuses unknown extensions, mismatched content, scripts in svg, empty and oversized files", async () => {
  const fixture = await makeFixture();
  try {
    const base = {
      root: fixture.root,
      publicDir: fixture.publicDir,
      postPath: "2026/attention-pooling.md",
    };
    await expectWriterError(saveUpload({ ...base, filename: "notes.txt", data: PNG }), 415);
    await expectWriterError(saveUpload({ ...base, filename: "fake.png", data: JPEG }), 415);
    await expectWriterError(
      saveUpload({
        ...base,
        filename: "evil.svg",
        data: Buffer.from("<svg><script>alert(1)</script></svg>"),
      }),
      415
    );
    await expectWriterError(
      saveUpload({ ...base, filename: "empty.png", data: Buffer.alloc(0) }),
      400
    );
    await expectWriterError(
      saveUpload({ ...base, filename: "big.png", data: Buffer.alloc(MAX_UPLOAD_BYTES + 1) }),
      413
    );
    await assert.rejects(readdir(path.join(fixture.publicDir, "assets")));
  } finally {
    await fixture.close();
  }
});

test("saveUpload refuses a post that does not exist", async () => {
  const fixture = await makeFixture();
  try {
    await expectWriterError(
      saveUpload({
        root: fixture.root,
        publicDir: fixture.publicDir,
        postPath: "2026/missing.md",
        filename: "a.png",
        data: PNG,
      }),
      404
    );
  } finally {
    await fixture.close();
  }
});

test("listMedia returns the files uploaded for a post and nothing else", async () => {
  const fixture = await makeFixture();
  try {
    const args = {
      root: fixture.root,
      publicDir: fixture.publicDir,
      postPath: "2026/attention-pooling.md",
    };
    assert.deepEqual(
      await listMedia({ publicDir: fixture.publicDir, postPath: "2026/attention-pooling.md" }),
      []
    );

    await saveUpload({ ...args, filename: "one.png", data: PNG });
    await writeFile(
      path.join(fixture.publicDir, "assets/img/2026/attention-pooling/notes.txt"),
      "ignore me"
    );

    assert.deepEqual(
      await listMedia({ publicDir: fixture.publicDir, postPath: "2026/attention-pooling.md" }),
      [{ name: "one.png", kind: "image", url: "/assets/img/2026/attention-pooling/one.png" }]
    );
  } finally {
    await fixture.close();
  }
});

test("setHeroFields adds heroImage and heroImageAlt and keeps the rest of the post", () => {
  const content = '---\ntitle: "Attention"\ndraft: false\n---\n\n## Body stays\n';
  const updated = setHeroFields(content, { url: "/assets/img/x.png", alt: "A chart" });

  assert.equal(
    updated,
    '---\ntitle: "Attention"\ndraft: false\nheroImage: "/assets/img/x.png"\nheroImageAlt: "A chart"\n---\n\n## Body stays\n'
  );
});

test("setHeroFields replaces an existing hero instead of duplicating it", () => {
  const content = '---\nheroImage: "/old.png"\nheroImageAlt: "Old"\n---\nBody\n';
  const updated = setHeroFields(content, { url: "/new.png", alt: "New" });

  assert.equal(updated, '---\nheroImage: "/new.png"\nheroImageAlt: "New"\n---\nBody\n');
});

test("setHeroFields refuses a post without frontmatter", () => {
  assert.throws(
    () => setHeroFields("No frontmatter", { url: "/a.png", alt: "" }),
    (error) => {
      assert.ok(error instanceof WriterError);
      assert.equal(error.status, 400);
      return true;
    }
  );
});
