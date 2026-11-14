import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { findBuiltStylesheet, renderPreview } from "../scripts/write/render.mjs";

test("renderPreview shows the title from frontmatter and renders the body without the YAML", async () => {
  const html = await renderPreview({
    markdown:
      '---\ntitle: "Hello & welcome"\ndescription: hidden text\n---\n\n## Section\n\nInline $x^2$ text.\n',
    stylesheetHref: "/_astro/site.css",
  });

  assert.match(html, /<h1[^>]*>Hello &amp; welcome<\/h1>/);
  assert.match(html, /<h2[^>]*>Section<\/h2>/);
  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /hidden text/);
  assert.match(html, /<link rel="stylesheet" href="\/_astro\/site\.css">/);
});

test("renderPreview works without frontmatter and without a stylesheet", async () => {
  const html = await renderPreview({ markdown: "Just a paragraph.", stylesheetHref: null });

  assert.match(html, /<p>Just a paragraph\.<\/p>/);
  assert.doesNotMatch(html, /rel="stylesheet"/);
});

test("findBuiltStylesheet reads the stylesheet from the last build", async () => {
  const base = await mkdtemp(path.join(tmpdir(), "writer-render-"));
  try {
    assert.equal(await findBuiltStylesheet(path.join(base, "missing")), null);

    await mkdir(base, { recursive: true });
    await writeFile(
      path.join(base, "index.html"),
      '<head><link rel="stylesheet" href="/_astro/index.abc.css"></head>'
    );
    assert.equal(await findBuiltStylesheet(base), "/_astro/index.abc.css");

    await writeFile(path.join(base, "index.html"), "<head></head>");
    assert.equal(await findBuiltStylesheet(base), null);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
