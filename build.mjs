#!/usr/bin/env node
// node build.mjs   build the site into dist/
import { build } from "./src/build/build.mjs";

const started = performance.now();
const { files } = await build();
console.log(`Built ${files.size} files into dist/ in ${Math.round(performance.now() - started)} ms`);
