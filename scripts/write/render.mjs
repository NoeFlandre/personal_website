import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createMarkdownProcessor,
  markdownConfigDefaults,
  parseFrontmatter,
} from "@astrojs/markdown-remark";
import astroConfig from "../../astro.config.mjs";
import { splitFrontmatter } from "./posts.mjs";

// Same markdown options Astro uses for the blog, so the preview matches the built post.
let processorPromise;
function getProcessor() {
  processorPromise ??= createMarkdownProcessor({
    ...markdownConfigDefaults,
    ...astroConfig.markdown,
  });
  return processorPromise;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function frontmatterOf(markdown) {
  try {
    return parseFrontmatter(markdown).frontmatter ?? {};
  } catch {
    return {};
  }
}

function textField(data, key) {
  return typeof data[key] === "string" ? data[key] : "";
}

// Same markup and classes as the hero on the post page (src/layouts/PostDetails.astro).
function heroHtml(data) {
  const src = textField(data, "heroImage");
  if (!src) return "";
  const alt = escapeHtml(textField(data, "heroImageAlt"));
  const caption = textField(data, "heroImageCaption");
  const imageClass = caption
    ? "max-h-[60vh] mx-auto h-auto w-full rounded-md object-contain !border-0"
    : "mb-8 max-h-[60vh] mx-auto h-auto w-full max-w-[640px] rounded-md object-contain !border-0";
  const image = `<img src="${escapeHtml(src)}" alt="${alt}" class="${imageClass}" loading="lazy">`;
  if (!caption) return image;
  return `<figure class="mx-auto mb-8 w-full max-w-[640px]">${image}<figcaption class="mt-2 text-center">${escapeHtml(caption)}</figcaption></figure>`;
}

/** Finds the main stylesheet that the last `npm run build` wrote into dist/. */
export async function findBuiltStylesheet(distDir) {
  let html;
  try {
    html = await readFile(path.join(distDir, "index.html"), "utf8");
  } catch {
    return null;
  }
  const match = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/.exec(html);
  return match ? match[1] : null;
}

/** Full HTML page for the preview iframe: the post's title and body, styled like the post page. */
export async function renderPreview({ markdown, stylesheetHref }) {
  const { body } = splitFrontmatter(markdown);
  const processor = await getProcessor();
  const { code } = await processor.render(body);

  const data = frontmatterOf(markdown);
  const title = textField(data, "title");
  const stylesheet = stylesheetHref
    ? `<link rel="stylesheet" href="${escapeHtml(stylesheetHref)}">`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
${stylesheet}
</head>
<body>
<main class="mx-auto w-full max-w-3xl min-w-0 px-4 pb-12 mt-8">
${title ? `<h1 class="inline-block max-w-full break-words text-2xl font-bold text-accent sm:text-3xl">${escapeHtml(title)}</h1>` : ""}
<article class="mx-auto min-w-0 prose mt-6 max-w-3xl">
${heroHtml(data)}
${code}
</article>
</main>
</body>
</html>`;
}
