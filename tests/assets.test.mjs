import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { minifyCss, svgDataUri } from "../src/build/assets.mjs";
import { bundleScripts } from "../src/build/scripts.mjs";

test("minifyCss keeps meaningful spaces", () => {
  assert.equal(
    minifyCss("/* c */ .a .b , .c > .d { margin: 0 auto ; grid-template-columns: repeat(3, minmax(0, 1fr)); } .e :focus { x: y }"),
    ".a .b,.c>.d{margin:0 auto;grid-template-columns:repeat(3,minmax(0,1fr))}.e :focus{x:y}"
  );
});

test("svgDataUri encodes what URLs need", () => {
  assert.equal(svgDataUri('<svg fill="#fff">\n  <path d="M0 0"/>\n</svg>'), "data:image/svg+xml,%3Csvg fill='%23fff'%3E%3Cpath d='M0 0'/%3E%3C/svg%3E");
});

async function modules(files) {
  const dir = await mkdtemp(join(tmpdir(), "bundle-"));
  for (const [name, source] of Object.entries(files)) await writeFile(join(dir, name), source);
  return dir;
}

test("bundleScripts orders modules by dependency and strips import/export", async () => {
  const dir = await modules({
    "main.js": 'import { b } from "./b.js";\nb();\n',
    "b.js": 'import { a } from "./a.js";\nexport function b() { return a(); }\n',
    "a.js": "export const a = () => 1;\n",
  });
  const out = await bundleScripts(join(dir, "main.js"));
  assert.ok(out.indexOf("const a") < out.indexOf("function b") && out.indexOf("function b") < out.indexOf("b();"));
  assert.doesNotMatch(out, /\b(import|export)\b/);
  new Function(out); // parses
});

test("bundleScripts rejects duplicate top-level names", async () => {
  const dir = await modules({
    "main.js": 'import { x } from "./x.js";\nfunction helper() {}\nx();\n',
    "x.js": "export function x() {}\nfunction helper() {}\n",
  });
  await assert.rejects(bundleScripts(join(dir, "main.js")), /"helper" is declared in both/);
});

test("image sizes from SVG and PNG headers", async () => {
  const { svgSize, pngSize } = await import("../src/build/assets.mjs");
  assert.deepEqual(svgSize('<svg xmlns="x" viewBox="0 0 960 540">'), { width: 960, height: 540 });
  assert.deepEqual(svgSize('<svg width="120px" height="80" viewBox="0 0 10 10">'), { width: 120, height: 80 });
  const png = Buffer.alloc(24);
  png.writeUInt32BE(0x49484452, 12);
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(480, 20);
  assert.deepEqual(pngSize(png), { width: 640, height: 480 });
});
