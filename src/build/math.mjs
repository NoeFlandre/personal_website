// Maths, rendered to HTML by KaTeX at build time: readers download no
// JavaScript for it, only KaTeX's styles and the fonts a page uses.
//
//   tex("x^2", false)          -> HTML
//   const styles = await loadMathStyles();
//   styles.css(assets)         -> KaTeX's CSS, to inline in pages with maths (fonts emitted as assets)
//
// The CSS is inlined rather than linked: it also hides the MathML copy kept
// for screen readers, so a page must never render without it.

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import katex from "katex";

export function tex(source, displayMode) {
  return katex.renderToString(source, { displayMode, throwOnError: true, strict: "ignore" });
}

export async function loadMathStyles() {
  const dist = dirname(createRequire(import.meta.url).resolve("katex"));
  const css = await readFile(join(dist, "katex-swap.min.css"), "utf8");
  const names = [...new Set([...css.matchAll(/url\(fonts\/([\w-]+)\.woff2\)/g)].map((m) => m[1]))];
  const fonts = new Map(await Promise.all(names.map(async (n) => [n, await readFile(join(dist, "fonts", `${n}.woff2`))])));
  let inline;

  return {
    css(assets) {
      inline ??= css.replace(
        /src:url\(fonts\/([\w-]+)\.woff2\) format\("woff2"\)(?:,url\([^)]+\) format\("[^"]+"\))*/g,
        (_, name) => `src:url("${assets.emitHashed("assets/katex", `${name}.woff2`, fonts.get(name))}") format("woff2")`
      );
      return inline;
    },
  };
}
