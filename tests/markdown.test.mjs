import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontMatter, renderInline, renderMarkdown, slugify } from "../src/build/markdown.mjs";

test("inline: links, emphasis, code and escaping", () => {
  assert.equal(
    renderInline("A [link](https://x.y/?a=1&b=2), **bold**, *it*, `<code>` & more"),
    'A <a href="https://x.y/?a=1&amp;b=2">link</a>, <strong>bold</strong>, <em>it</em>, <code>&lt;code&gt;</code> &amp; more'
  );
});

test("inline: linkClass and line breaks", () => {
  assert.equal(renderInline("a\n[b](#c)", { linkClass: "x" }), 'a<br><a class="x" href="#c">b</a>');
});

test("inline: underscores inside words are not emphasis", () => {
  assert.equal(renderInline("snake_case_name and _this_"), "snake_case_name and <em>this</em>");
});

test("maths: $inline$, $$inline$$ and display blocks; prices stay text", () => {
  assert.match(renderInline("where $x^2$ grows"), /^where <span class="katex">.*<\/span> grows$/s);
  assert.match(renderInline("worth $$1 + 1$$ kg"), /^worth <span class="katex">/);
  assert.equal(renderInline("from $5 to $10"), "from $5 to $10");
  const block = renderMarkdown("Let\n\n$$\nN = \\frac{H}{P}\n$$\n\nso");
  assert.match(block, /<p>Let<\/p>\n<div class="math-display"><span class="katex-display">/);
  assert.match(block, /<p>so<\/p>$/);
});

test("headings get ids; posts using # headings shift down a level", () => {
  assert.equal(renderMarkdown("## Step 1): the mean\n\n## Step 1): the mean"), '<h2 id="step-1-the-mean">Step 1): the mean</h2>\n<h2 id="step-1-the-mean-1">Step 1): the mean</h2>');
  assert.equal(renderMarkdown("# Top\n\n## Sub"), '<h2 id="top">Top</h2>\n<h3 id="sub">Sub</h3>');
});

test("tables are wrapped so they can scroll", () => {
  assert.match(renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |"), /^<div class="table-wrap"><table>[\s\S]*<td>2<\/td>[\s\S]*<\/table>\n<\/div>$/);
});

test("youtube shortcode becomes a click-to-play link, keeping the start time", () => {
  const out = renderMarkdown("{% youtube https://www.youtube.com/watch?v=dfuhwi1-KHk&t=14s %}");
  assert.match(out, /^<a class="video" href="https:\/\/www\.youtube\.com\/watch\?v=dfuhwi1-KHk&amp;t=14s" data-video="dfuhwi1-KHk" data-start="14">/);
  assert.match(renderMarkdown("{% youtube https://youtu.be/42CoSIxwYio?si=x %}"), /data-video="42CoSIxwYio"/);
});

test("an image alone in its paragraph goes through the image hook as a figure", () => {
  const image = ({ alt, src, caption, inline }) => `[${alt}|${src}|${caption}|${inline}]`;
  assert.equal(renderMarkdown('![Alt](photo#480 "Figure 1: $Z$ and *z*")', { image }).replace(/<span class="katex">.*<\/span>/s, "Z"), "[Alt|photo#480|Figure 1: Z and <em>z</em>|false]");
  assert.equal(renderMarkdown("Text ![Alt](photo) text", { image }), "<p>Text [Alt|photo|null|true] text</p>");
});

test("slugify matches the old site's tag and heading slugs", () => {
  assert.equal(slugify("Paper Review"), "paper-review");
  assert.equal(slugify("Café & <em>Crème</em>"), "cafe-creme");
});

test("front matter: strings, quoted values, lists and one nested map", () => {
  const { data, body } = parseFrontMatter('---\ntitle: "A: b"\ndate: 2026-10-15T09:00:00+02:00\ntags: [Post, Paper Review]\nnext:\n  title: N\n  url: https://x\n---\nBody');
  assert.deepEqual(data, { title: "A: b", date: "2026-10-15T09:00:00+02:00", tags: ["Post", "Paper Review"], next: { title: "N", url: "https://x" } });
  assert.equal(body, "Body");
});

test("front matter is optional", () => {
  assert.deepEqual(parseFrontMatter("Just text"), { data: {}, body: "Just text" });
});
