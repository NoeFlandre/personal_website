import { test } from "node:test";
import assert from "node:assert/strict";
import { attrs, escape, html, raw } from "../src/build/html.mjs";

test("escapes interpolated text", () => {
  assert.equal(String(html`<p>${'<a href="x">&'}</p>`), "<p>&lt;a href=&quot;x&quot;&gt;&amp;</p>");
});

test("keeps nested html and raw() as is", () => {
  const inner = html`<b>${"x"}</b>`;
  assert.equal(String(html`<p>${inner}${raw("<i>y</i>")}</p>`), "<p><b>x</b><i>y</i></p>");
});

test("joins arrays and drops null, undefined and false", () => {
  assert.equal(String(html`${[1, null, false, undefined, "a"]}`), "1a");
});

test("attrs skips empty values and renders booleans", () => {
  assert.equal(String(attrs({ class: "a", hidden: true, title: null, alt: "" })), ' class="a" hidden alt=""');
});

test("escape covers quotes", () => {
  assert.equal(escape(`"'`), "&quot;&#39;");
});
