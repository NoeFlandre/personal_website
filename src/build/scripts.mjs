// Bundles the browser scripts in src/scripts into one classic script.
//
// Convention: modules only use named `import { a } from "./file.js"` and
// `export function` / `export const`. The bundle puts every module, in
// dependency order, inside one IIFE; top-level names must be unique across
// modules (checked here), so keep helpers inside the exported functions.

import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const IMPORT = /^import\s*\{[^}]*\}\s*from\s*["'](\.\/[\w-]+\.js)["'];?[ \t]*$/gm;
const DECLARATION = /^(?:export\s+)?(?:async\s+)?(?:function\*?|const|let|class)\s+([\w$]+)/gm;

export async function bundleScripts(entry) {
  const ordered = [];
  const seen = new Set();

  async function visit(file, trail) {
    if (trail.includes(file)) throw new Error(`Import cycle: ${[...trail, file].map((f) => basename(f)).join(" -> ")}`);
    if (seen.has(file)) return;
    const source = await readFile(file, "utf8");
    for (const [, spec] of source.matchAll(IMPORT)) await visit(join(dirname(file), spec), [...trail, file]);
    seen.add(file);
    ordered.push({ file, source });
  }
  await visit(entry, []);

  const owners = new Map();
  const parts = ordered.map(({ file, source }) => {
    const code = source.replace(IMPORT, "").replace(/^export\s+(?=(?:async\s+)?(?:function|const|let|class)\b)/gm, "");
    if (/^\s*(import|export)\b/m.test(code)) throw new Error(`${basename(file)}: unsupported import/export form`);
    for (const [, name] of code.matchAll(DECLARATION)) {
      if (owners.has(name)) throw new Error(`"${name}" is declared in both ${owners.get(name)} and ${basename(file)}`);
      owners.set(name, basename(file));
    }
    return `// ${basename(file)}\n${code.trim()}`;
  });

  return `(() => {\n"use strict";\n\n${parts.join("\n\n")}\n})();\n`;
}
