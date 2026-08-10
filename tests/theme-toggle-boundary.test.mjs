import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the active theme toggle stays owned by Header and its early script", () => {
  assert.equal(existsSync(new URL("../src/components/ThemeToggle.astro", import.meta.url)), false);

  const header = read("src/components/Header.astro");
  const layout = read("src/layouts/Layout.astro");
  const themeScript = read("public/toggle-theme.js");

  assert.match(header, /id="theme-btn"/);
  assert.match(layout, /<script\s+is:inline\s+src="\/toggle-theme\.js"><\/script>/);
  assert.match(themeScript, /document\.querySelector\("#theme-btn"\)/);
});
