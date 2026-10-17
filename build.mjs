#!/usr/bin/env node
// node build.mjs           build the site into dist/
// node build.mjs --check   exit 1 if dist/ is not what the sources produce
import { build } from "./src/build/build.mjs";

const check = process.argv.includes("--check");
const started = performance.now();
const { files, stale } = await build({ check });

if (check) {
  if (stale.length) {
    console.error(`dist/ is out of date (${stale.length} files). Run: node build.mjs\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log("dist/ is up to date");
} else {
  console.log(`Built ${files.size} files into dist/ in ${Math.round(performance.now() - started)} ms`);
}
