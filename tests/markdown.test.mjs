import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontMatter, renderInline, renderMarkdown } from "../src/build/markdown.mjs";

test("inline: links, emphasis, code and escaping", () => {
  assert.equal(
    renderInline("A [link](https://x.y/?a=1&b=2), **bold**, *it*, `<code>` & <tag>"),
    'A <a href="https://x.y/?a=1&amp;b=2">link</a>, <strong>bold</strong>, <em>it</em>, <code>&lt;code&gt;</code> &amp; &lt;tag&gt;'
  );
});

test("inline: linkClass and line breaks", () => {
  assert.equal(renderInline("a\n[b](#c)", { linkClass: "x" }), 'a<br>\n<a class="x" href="#c">b</a>');
});

test("inline: underscores inside words are not emphasis", () => {
  assert.equal(renderInline("snake_case_name and _this_"), "snake_case_name and <em>this</em>");
});

test("blocks: paragraphs, headings, lists, quotes and code", () => {
  const out = renderMarkdown("## Title\n\nOne\ntwo\n\n- a\n- b\n\n1. x\n\n> q\n\n```js\nlet a = '<';\n```");
  assert.equal(
    out,
    [
      "<h2>Title</h2>",
      "<p>One<br>\ntwo</p>",
      "<ul><li>a</li><li>b</li></ul>",
      "<ol><li>x</li></ol>",
      "<blockquote><p>q</p></blockquote>",
      '<pre><code class="language-js">let a = &#39;&lt;&#39;;</code></pre>',
    ].join("\n")
  );
});

test("a paragraph holding only an image goes through the image hook", () => {
  const out = renderMarkdown('![Alt](photo "Caption")', { image: ({ alt, src, title, inline }) => `[${alt}|${src}|${title}|${inline}]` });
  assert.equal(out, "[Alt|photo|Caption|false]");
});

test("front matter: strings, quoted values, lists and one nested map", () => {
  const { data, body } = parseFrontMatter('---\ntitle: "A: b"\ndate: 2026-10-15\ntags: [post, ai]\nnext:\n  title: N\n  url: https://x\n---\nBody');
  assert.deepEqual(data, { title: "A: b", date: "2026-10-15", tags: ["post", "ai"], next: { title: "N", url: "https://x" } });
  assert.equal(body, "Body");
});

test("front matter is optional", () => {
  assert.deepEqual(parseFrontMatter("Just text"), { data: {}, body: "Just text" });
});
