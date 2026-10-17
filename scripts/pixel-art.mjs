#!/usr/bin/env node
// The site's drawings, as pixel art. Sprites are character maps (one character
// per pixel, "." is empty); scenes place them at a pixel size and are written
// to src/assets/img as SVG, one <path> per colour.
//
//   node scripts/pixel-art.mjs     (npm run art)

import { writeFile } from "node:fs/promises";

const COLORS = {
  k: "#01242e", // ink
  f: "#9ff0ff", // frost
  b: "#4d8bf0", // blue
  c: "#c6e2ef", // ice
  w: "#f4fbff", // paper
  p: "#f4a6a0", // cheeks
};

const SPRITES = {
  satbot: [
    ".........f.........",
    ".........k.........",
    ".........k.........",
    ".....kkkkkkkkk.....",
    "kkkk.kfffffffk.kkkk",
    "kcck.kffkfkffk.kcck",
    "kcckkkfffffffkkkcck",
    "kcck.kfkfffkfk.kcck",
    "kkkk.kffkkkffk.kkkk",
    ".....kfffffffk.....",
    ".....kkkkkkkkk.....",
    "......k.....k......",
    ".....kk.....kk.....",
  ],
  polly: [
    "....kkkkk.......",
    "...kfffffkk.....",
    "..kfffffffffkk..",
    ".kfffffffffffffk",
    ".kffkffffffkfffk",
    "kfffkffffffkffk.",
    "kfpfffkfffkffpk.",
    "kffffffkkkffffk.",
    ".kffffffffffffk.",
    "..kkfffffffffk..",
    "....kkkkkkkkk...",
    ".....k....k.....",
    "....kk....kk....",
  ],
  page: [
    "kkkkkkkkkk...",
    "kwwwwwwwwkk..",
    "kwbbbbwwwkwk.",
    "kwwwwwwwwkkkk",
    "kwbbbbbbbwwwk",
    "kwwwwwwwwwwwk",
    "kwwkwwwwkwwwk",
    "kwwwwwwwwwwwk",
    "kwwkwwwwkwwwk",
    "kwwwkkkkwwwwk",
    "kwbbbbbbbbwwk",
    "kwwwwwwwwwwwk",
    "kkkkkkkkkkkkk",
    "..k.....k....",
    ".kk.....kk...",
  ],
  globe: [
    ".....kkkkk.....",
    "...kkbbbbbkk...",
    "..kbbffbbbbbk..",
    ".kbfffffbbbbbk.",
    ".kbffkffbfkfbk.",
    "kbbffkbbffkffbk",
    "kbbbffbbbbffffk",
    "kbbbbbkbbkfffbk",
    "kbbbbbbkkbbffbk",
    ".kbbbbbffbbbbk.",
    ".kbbbbffffbbbk.",
    "..kbbbbffbbbk..",
    "...kkbbbbbkk...",
    ".....kkkkk.....",
  ],
  pin: [
    "...kkkkk...",
    "..kbbbbbk..",
    ".kbbbbbbbk.",
    "kbbkbbbkbbk",
    "kbbkbbbkbbk",
    "kbbbbbbbbbk",
    "kbpkbbbkpbk",
    ".kbbkkkbbk.",
    "..kbbbbbk..",
    "...kbbbk...",
    "....kbk....",
    ".....k.....",
  ],
  lamp: [
    ".....kk.....",
    ".....kk.....",
    ".....kk.....",
    ".....kk.....",
    "....kkkk....",
    "...kkkkkk...",
    "..kkkkkkkk..",
    ".kkfkkkkfkk.",
    "kkkkkkkkkkkk",
    "kkkkfkkfkkkk",
    "kkkkkffkkkkk",
    "cccccccccccc",
    "...ffffff...",
    "....ffff....",
  ],
  face: [
    ".kkkkkk.",
    "kffffffk",
    "kfkffkfk",
    "kffffffk",
    "kfkffkfk",
    "kffkkffk",
    "kffffffk",
    ".kkkkkk.",
  ],
  star: ["..f..", "..f..", "fffff", "..f..", "..f.."],
};

// Sprite height in pixels, to stand things on the bottom edge.
const rows = (name) => SPRITES[name].length;

const SCENES = {
  // About: robot and globe, bleeding off the right edge
  "hero-about.svg": {
    width: 810,
    height: 530,
    items: [
      { sprite: "star", x: 96, y: 90, size: 8 },
      { sprite: "star", x: 352, y: 200, size: 6 },
      { sprite: "star", x: 720, y: 40, size: 8 },
      { sprite: "satbot", x: 0, y: 530 - rows("satbot") * 22, size: 22 },
      { sprite: "globe", x: 460, y: 530 - rows("globe") * 22, size: 22 },
    ],
  },
  // CV: a tile repeated along the band
  "band-cv.svg": {
    width: 360,
    height: 220,
    items: [
      { sprite: "page", x: 8, y: 220 - rows("page") * 12, size: 12 },
      { sprite: "polly", x: 164, y: 220 - rows("polly") * 12, size: 12 },
    ],
  },
  // Blog: a lamp hanging from the top, a pin standing below
  "blog-lamp.svg": { width: 288, height: 336, items: [{ sprite: "lamp", x: 0, y: 0, size: 24 }] },
  "blog-block.svg": { width: 288, height: 290, items: [{ sprite: "pin", x: 23, y: 290 - rows("pin") * 22, size: 22 }] },
  // Contact: everyone, side by side
  "hero-contact.svg": {
    width: 1440,
    height: 540,
    items: [
      { sprite: "star", x: 150, y: 110, size: 10 },
      { sprite: "star", x: 520, y: 50, size: 8 },
      { sprite: "star", x: 860, y: 130, size: 10 },
      { sprite: "star", x: 1180, y: 70, size: 8 },
      { sprite: "page", x: 0, y: 540 - rows("page") * 18, size: 18 },
      { sprite: "satbot", x: 258, y: 540 - rows("satbot") * 18, size: 18 },
      { sprite: "globe", x: 618, y: 540 - rows("globe") * 18, size: 18 },
      { sprite: "polly", x: 906, y: 540 - rows("polly") * 18, size: 18 },
      { sprite: "pin", x: 1230, y: 540 - rows("pin") * 18, size: 18 },
    ],
  },
  // Footer mark and favicon
  "mark.svg": { width: 76, height: 52, items: [{ sprite: "satbot", x: 0, y: 0, size: 4 }] },
  "favicon.svg": {
    width: 64,
    height: 64,
    background: '<rect width="64" height="64" rx="12" fill="#8cc2dd"/>',
    items: [{ sprite: "face", x: 8, y: 8, size: 6 }],
  },
};

// Runs of one colour on one row become one rectangle.
function render({ width, height, items, background = "" }) {
  const paths = {};
  for (const { sprite, x, y, size } of items) {
    SPRITES[sprite].forEach((row, r) => {
      for (let c = 0; c < row.length; ) {
        const ch = row[c];
        let n = 1;
        while (row[c + n] === ch) n++;
        if (ch !== ".") {
          if (!COLORS[ch]) throw new Error(`${sprite}: unknown colour "${ch}"`);
          (paths[ch] ??= []).push(`M${x + c * size} ${y + r * size}h${n * size}v${size}h${-n * size}z`);
        }
        c += n;
      }
    });
  }
  const body = Object.entries(paths)
    .map(([ch, d]) => `<path fill="${COLORS[ch]}" d="${d.join("")}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">${background}${body}</svg>\n`;
}

const dir = new URL("../src/assets/img/", import.meta.url);
for (const [file, scene] of Object.entries(SCENES)) {
  await writeFile(new URL(file, dir), render(scene));
  console.log(`wrote src/assets/img/${file}`);
}
