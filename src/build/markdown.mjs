// Markdown for posts and for the short strings in the content JSON files.
//
//   renderMarkdown(source, { image })  -> HTML for a post body
//   renderInline(text, { linkClass })  -> HTML for one line of content
//   parseFrontMatter(source)           -> { data, body }
//
// On top of GitHub-flavoured Markdown (marked):
//   - $inline$, $$inline$$ and $$ display $$ maths, rendered by KaTeX at build time
//   - {% youtube <url> %} becomes a click-to-play video (no YouTube code until clicked)
//   - an image alone in its paragraph becomes a <figure>, through the `image` hook
//   - headings get ids; a post that uses "#" headings is shifted one level down,
//     because the page title is the only <h1>
//   - tables scroll sideways on small screens

import { Marked, Renderer } from "marked";
import { escape } from "./html.mjs";
import { tex } from "./math.mjs";

export function renderMarkdown(source, { image } = {}) {
  const marked = createMarked({ image });
  const tokens = marked.lexer(String(source));
  let hasH1 = false;
  marked.walkTokens(tokens, (t) => (hasH1 ||= t.type === "heading" && t.depth === 1));
  const ids = new Map();
  marked.use({
    renderer: {
      heading({ tokens: inline, depth, text }) {
        const level = Math.min(depth + (hasH1 ? 1 : 0), 6);
        const base = slugify(text) || "section";
        const n = ids.get(base) ?? 0;
        ids.set(base, n + 1);
        return `<h${level} id="${n ? `${base}-${n}` : base}">${this.parser.parseInline(inline)}</h${level}>\n`;
      },
    },
  });
  return marked.parser(tokens).trim();
}

export function renderInline(text, { linkClass } = {}) {
  return createMarked({ linkClass, breaks: true }).parseInline(String(text));
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;|&#\d+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createMarked({ image, linkClass, breaks = false }) {
  const marked = new Marked({ gfm: true, breaks });
  marked.use({
    extensions: [mathBlock, mathInline, youtube],
    renderer: {
      link({ href, title, tokens }) {
        return `<a${linkClass ? ` class="${escape(linkClass)}"` : ""} href="${escape(href)}"${title ? ` title="${escape(title)}"` : ""}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        if (image) return image({ alt: text, src: href, title, inline: true, caption: title && renderCaption(title) });
        return `<img src="${escape(href)}" alt="${escape(text)}">`;
      },
      paragraph({ tokens }) {
        const only = tokens.filter((t) => !(t.type === "text" && !t.text.trim()));
        if (image && only.length === 1 && only[0].type === "image") {
          const { href, title, text } = only[0];
          return image({ alt: text, src: href, title, inline: false, caption: title && renderCaption(title) }) + "\n";
        }
        return false;
      },
      table(token) {
        return `<div class="table-wrap">${Renderer.prototype.table.call(this, token)}</div>\n`;
      },
    },
  });
  return marked;
}

// Image titles are captions, and captions may hold maths and emphasis.
function renderCaption(title) {
  return createMarked({}).parseInline(title);
}

const mathBlock = {
  name: "mathBlock",
  level: "block",
  start: (src) => src.match(/^\$\$/m)?.index,
  tokenizer(src) {
    const m = /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/.exec(src);
    if (m) return { type: "mathBlock", raw: m[0], text: m[1].trim() };
  },
  renderer: ({ text }) => `<div class="math-display">${tex(text, true)}</div>\n`,
};

// $x$ needs no space inside the dollars and no digit after the closing one,
// so "it costs $5 and $10" stays text.
const mathInline = {
  name: "mathInline",
  level: "inline",
  start: (src) => src.indexOf("$"),
  tokenizer(src) {
    const m = /^\$\$(?!\$)([\s\S]+?)\$\$/.exec(src) || /^\$(?![\s$])((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/.exec(src);
    if (m) return { type: "mathInline", raw: m[0], text: m[1].trim() };
  },
  renderer: ({ text }) => tex(text, false),
};

const youtube = {
  name: "youtube",
  level: "block",
  start: (src) => src.match(/^\{%\s*youtube/m)?.index,
  tokenizer(src) {
    const m = /^\{%\s*youtube\s+(\S+)\s*%\}[ \t]*(?:\n|$)/.exec(src);
    if (m) return { type: "youtube", raw: m[0], ...parseYouTube(m[1]) };
  },
  renderer: ({ id, start }) => {
    const watch = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
    return `<a class="video" href="${escape(watch)}" data-video="${id}"${start ? ` data-start="${start}"` : ""}>
  <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async">
  <span class="video-play"><span class="video-play-icon" aria-hidden="true"></span>Play video</span>
</a>\n`;
  },
};

function parseYouTube(input) {
  const url = new URL(input.startsWith("http") ? input : `https://youtu.be/${input}`);
  const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") || url.pathname.split("/").pop();
  if (!/^[\w-]{6,}$/.test(id ?? "")) throw new Error(`Cannot read a YouTube id from "${input}"`);
  const start = Number.parseInt(url.searchParams.get("t") ?? url.searchParams.get("start") ?? "", 10);
  return { id, start: Number.isFinite(start) && start > 0 ? start : 0 };
}

// Front matter: a `---` block of `key: value` lines, `key: [a, b]` lists and
// one level of indented `child: value` maps. Values stay strings, except lists.
export function parseFrontMatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(String(source).replace(/\r\n?/g, "\n"));
  if (!match) return { data: {}, body: String(source) };

  const data = {};
  let parent = null;
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const nested = /^\s{2,}([\w-]+):\s*(.*)$/.exec(line);
    if (nested && parent) {
      data[parent][nested[1]] = parseValue(nested[2]);
      continue;
    }
    const pair = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!pair) throw new Error(`Front matter: cannot read line "${line}"`);
    if (pair[2] === "") {
      data[pair[1]] = {};
      parent = pair[1];
    } else {
      data[pair[1]] = parseValue(pair[2]);
      parent = null;
    }
  }
  return { data, body: String(source).replace(/\r\n?/g, "\n").slice(match[0].length) };
}

function parseValue(value) {
  const v = value.trim();
  if (v.startsWith("[") && v.endsWith("]")) {
    return v.slice(1, -1).split(",").map((x) => unquote(x.trim())).filter(Boolean);
  }
  return unquote(v);
}

function unquote(v) {
  return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}
