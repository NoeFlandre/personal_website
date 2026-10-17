// The site build: src/ in, a static site out.
//
//   const { files } = await build({ root });          // write dist/
//   const { stale } = await build({ root, check: true }); // compare with dist/
//
// Everything else (content loading, templates, assets, feeds) is internal.

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { loadAssets } from "./assets.mjs";
import { loadContent } from "./content.mjs";
import { renderRobots, renderRss, renderSitemap } from "./feeds.mjs";
import { bundleScripts } from "./scripts.mjs";
import { renderPage } from "../templates/layout.mjs";
import { renderHome } from "../templates/home.mjs";
import { renderPost } from "../templates/post.mjs";
import { renderNotFound } from "../templates/not-found.mjs";
import { createUi } from "../templates/ui.mjs";

export async function build({ root = process.cwd(), outDir = "dist", check = false } = {}) {
  const src = join(root, "src");
  const out = resolve(root, outDir);
  if (out === resolve(root) || !out.startsWith(resolve(root) + sep)) throw new Error(`Refusing to write outside the project: ${out}`);

  const content = await loadContent(join(src, "content"));
  const assets = await loadAssets(join(src, "assets"));
  const ctx = {
    site: content.site,
    css: assets.css(await readStyles(join(src, "styles"))),
    script: assets.emitHashed("assets", "site.js", await bundleScripts(join(src, "scripts", "main.js"))),
    font: assets.url("fonts/inter.woff2"),
    favicon: assets.url("img/favicon.svg"),
  };

  const files = new Map();
  const page = (file, isHome, render) => {
    const ui = createUi({ site: content.site, assets, isHome });
    files.set(file, renderPage(ctx, ui, render(ui)));
  };

  page("index.html", true, (ui) => renderHome(ctx, ui, content));
  for (const post of content.posts) page(`posts/${post.id}/index.html`, false, (ui) => renderPost(ctx, ui, post, content));
  page("404.html", false, (ui) => renderNotFound(ctx, ui, content));

  files.set("rss.xml", renderRss(content));
  files.set("sitemap.xml", renderSitemap({ site: content.site, paths: ["/", ...content.posts.map((p) => p.url)] }));
  files.set("robots.txt", renderRobots(content));
  for (const [path, data] of assets.files()) files.set(path, data);

  if (check) return { files, stale: await compare(out, files) };
  await rm(out, { recursive: true, force: true });
  await Promise.all(
    [...files].map(async ([path, data]) => {
      const target = join(out, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, data);
    })
  );
  return { files };
}

async function readStyles(dir) {
  const names = (await readdir(dir)).filter((n) => n.endsWith(".css")).sort();
  const parts = await Promise.all(names.map((n) => readFile(join(dir, n), "utf8")));
  return parts.join("\n");
}

// Paths that differ between a fresh build and what is on disk.
async function compare(out, files) {
  const onDisk = await listFiles(out).catch(() => []);
  const stale = [];
  for (const [path, data] of files) {
    const current = await readFile(join(out, path)).catch(() => null);
    if (!current || !current.equals(Buffer.from(data))) stale.push(path);
  }
  for (const file of onDisk) {
    const path = relative(out, file).split(sep).join("/");
    if (!files.has(path)) stale.push(path);
  }
  return stale.sort();
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}
