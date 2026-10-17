// The site build: src/ in, a static site out.
//
//   const { files } = await build({ root });               // write dist/
//   const { files } = await build({ root, write: false }); // in memory only
//
// Everything else (content loading, templates, assets, feeds) is internal.

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { loadAssets } from "./assets.mjs";
import { groupByTag, loadContent } from "./content.mjs";
import { renderRedirect, renderRobots, renderRss, renderSitemap } from "./feeds.mjs";
import { loadMathStyles } from "./math.mjs";
import { bundleScripts } from "./scripts.mjs";
import { renderPage } from "../templates/layout.mjs";
import { renderHome } from "../templates/home.mjs";
import { renderPost } from "../templates/post.mjs";
import { renderPostList, renderTagIndex } from "../templates/post-list.mjs";
import { renderNotFound } from "../templates/not-found.mjs";
import { createUi } from "../templates/ui.mjs";

export async function build({ root = process.cwd(), outDir = "dist", write = true } = {}) {
  const src = join(root, "src");
  const out = resolve(root, outDir);
  if (out === resolve(root) || !out.startsWith(resolve(root) + sep)) throw new Error(`Refusing to write outside the project: ${out}`);

  const [content, assets, math] = await Promise.all([loadContent(join(src, "content")), loadAssets(join(src, "assets")), loadMathStyles()]);
  const ctx = {
    site: content.site,
    css: assets.css(await readStyles(join(src, "styles"))),
    script: assets.emitHashed("assets", "site.js", await bundleScripts(join(src, "scripts", "main.js"))),
    font: assets.url("fonts/inter.woff2"),
    favicon: assets.url("img/favicon.svg"),
    mathCss: () => math.css(assets),
  };

  const files = new Map();
  const paths = [];
  // Pages are written as <path>/index.html and linked without a trailing
  // slash, like the old site (e.g. /posts/2026/attention-pooling).
  const page = (path, render) => {
    const ui = createUi({ site: content.site, assets, isHome: path === "/" });
    const result = render(ui);
    files.set(path === "/404" ? "404.html" : join(path, "index.html").slice(1), renderPage(ctx, ui, result));
    if (path !== "/404") paths.push(path);
  };

  const { posts } = content;
  const tags = groupByTag(posts);
  page("/", (ui) => renderHome(ctx, ui, content));
  page("/posts", (ui) => renderPostList(ctx, ui, { posts, tags }));
  for (const post of posts) page(post.url, (ui) => renderPost(ctx, ui, post, content));
  page("/tags", (ui) => renderTagIndex(ctx, ui, { tags }));
  for (const tag of tags) page(tag.url, (ui) => renderPostList(ctx, ui, { posts, tags, tag }));
  page("/404", (ui) => renderNotFound(ctx, ui, content));

  files.set("rss.xml", renderRss(content));
  files.set("sitemap.xml", renderSitemap({ site: content.site, paths }));
  files.set("robots.txt", renderRobots(content));
  for (const [from, to] of Object.entries(content.site.redirects ?? {})) {
    files.set(join(from, "index.html").slice(1), renderRedirect({ site: content.site, to }));
  }
  for (const [path, data] of assets.files()) files.set(path, data);
  // Files that keep their old, unhashed URLs (CV, social image, icons).
  for (const file of await listFiles(join(src, "static"))) {
    files.set(relative(join(src, "static"), file).split(sep).join("/"), await readFile(file));
  }

  if (!write) return { files };
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

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}
