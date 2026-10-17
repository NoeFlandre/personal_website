// Asset pipeline. `loadAssets()` reads src/assets once; after that every
// lookup is synchronous, so templates can ask for URLs while rendering.
//
//   assets.url("img/favicon.svg")    -> "/assets/img/favicon.3f2a91c0de.svg"
//   assets.dataUri("img/mark.svg")   -> "data:image/svg+xml,..."
//   assets.image("portrait")         -> { width, height, sources, fallback }
//   assets.data("icons.json")        -> parsed JSON
//   assets.files()                   -> [[publicPath, Buffer], ...] actually used
//
// Fingerprinted file names let hosts cache them forever.

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";

export const hash = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

export async function loadAssets(dir) {
  const sources = new Map();
  for (const file of await listFiles(dir)) {
    sources.set(relative(dir, file).split("\\").join("/"), await readFile(file));
  }
  const emitted = new Map();

  const read = (rel) => {
    const buf = sources.get(rel);
    if (!buf) throw new Error(`Unknown asset "${rel}"`);
    return buf;
  };

  const emit = (publicPath, content) => {
    emitted.set(publicPath, content);
    return "/" + publicPath;
  };

  const fingerprinted = (rel, content = read(rel)) => {
    const ext = extname(rel);
    const name = `${basename(rel, ext)}.${hash(content)}${ext}`;
    return join("assets", dirname(rel), name).split("\\").join("/");
  };

  return {
    url(rel) {
      return emit(fingerprinted(rel), read(rel));
    },

    dataUri(rel) {
      if (!rel.endsWith(".svg")) throw new Error(`dataUri only inlines SVG, got "${rel}"`);
      return svgDataUri(read(rel).toString("utf8"));
    },

    data(rel) {
      return JSON.parse(read(rel).toString("utf8"));
    },

    // A picture by name: either <name>.svg, or responsive raster files named
    // <name>-<width>.<avif|webp|jpg|png> with one jpg or png as the fallback.
    image(name) {
      if (sources.has(`img/${name}.svg`)) {
        const size = svgSize(read(`img/${name}.svg`).toString("utf8"));
        return { ...size, sources: [], fallback: this.url(`img/${name}.svg`) };
      }
      const pattern = new RegExp(`^img/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)\\.(avif|webp|jpg|png)$`);
      const variants = [...sources.keys()]
        .map((rel) => ({ rel, m: pattern.exec(rel) }))
        .filter((v) => v.m)
        .map(({ rel, m }) => ({ rel, width: Number(m[1]), type: m[2] }))
        .sort((a, b) => a.width - b.width);
      const fallback = variants.find((v) => v.type === "jpg" || v.type === "png");
      if (!fallback) throw new Error(`Image "${name}" not found (needs img/${name}.svg or img/${name}-<width>.jpg|png)`);
      const size = fallback.type === "jpg" ? jpegSize(read(fallback.rel)) : pngSize(read(fallback.rel));
      const largest = variants.at(-1).width;
      const srcset = (type) =>
        variants
          .filter((v) => v.type === type)
          .map((v) => `${this.url(v.rel)} ${v.width}w`)
          .join(", ");
      return {
        // Report the size of the largest file, so small screenshots are not upscaled.
        width: largest,
        height: Math.round((size.height * largest) / size.width),
        sources: ["avif", "webp"].map((type) => ({ type: `image/${type}`, srcset: srcset(type) })).filter((s) => s.srcset),
        fallback: this.url(fallback.rel),
      };
    },

    // Inline SVG url()s, fingerprint other url()s, minify.
    css(source) {
      const css = source.replace(/url\("\/assets\/([^"]+)"\)/g, (_, rel) =>
          rel.endsWith(".svg") ? `url("${this.dataUri(rel)}")` : `url("${this.url(rel)}")`
        );
      return minifyCss(css);
    },

    // Emit an already-built text file (e.g. the script bundle) under a hashed name.
    emitHashed(publicDir, name, content) {
      const ext = extname(name);
      return emit(`${publicDir}/${basename(name, ext)}.${hash(content)}${ext}`, content);
    },

    files() {
      return [...emitted];
    },
  };
}

export function svgDataUri(svg) {
  const compact = svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/"/g, "'")
    .trim();
  return "data:image/svg+xml," + compact.replace(/[%#<>?\[\\\]^`{|}]/g, encodeURIComponent);
}

export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/:\s+/g, ":")
    .replace(/;}/g, "}")
    .trim();
}

export function pngSize(buf) {
  if (buf.readUInt32BE(12) !== 0x49484452) throw new Error("Not a PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function svgSize(svg) {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
  const attr = (name) => Number.parseFloat(new RegExp(`\\s${name}="([\\d.]+)(px)?"`).exec(root)?.[1]);
  const box = /viewBox="([^"]+)"/.exec(root)?.[1].trim().split(/[\s,]+/).map(Number);
  const width = attr("width") || box?.[2];
  const height = attr("height") || box?.[3];
  if (!width || !height) throw new Error("SVG has no size");
  return { width: Math.round(width), height: Math.round(height) };
}

// Width and height from a baseline or progressive JPEG.
export function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error("Not a JPEG");
    const marker = buf[i + 1];
    const length = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  throw new Error("JPEG size not found");
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}
