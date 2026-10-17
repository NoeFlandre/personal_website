// Maths, rendered to HTML by KaTeX at build time: readers download no
// JavaScript for it, only KaTeX's stylesheet and the fonts a page uses.
//
//   tex("x^2", false)          -> HTML
//   const css = await loadMathStyles();
//   css.emit(assets)           -> "/assets/katex/katex.<hash>.css" (fonts emitted alongside)

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
  let url;

  return {
    emit(assets) {
      if (url) return url;
      const rewritten = css.replace(
        /src:url\(fonts\/([\w-]+)\.woff2\) format\("woff2"\)(?:,url\([^)]+\) format\("[^"]+"\))*/g,
        (_, name) => `src:url(${assets.emitHashed("assets/katex", `${name}.woff2`, fonts.get(name))}) format("woff2")`
      );
      url = assets.emitHashed("assets/katex", "katex.css", rewritten);
      return url;
    },
  };
}
