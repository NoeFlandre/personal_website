// A small Markdown renderer covering what the posts and content files use:
//
//   blocks:  paragraphs, ## headings, - / 1. lists, > quotes, ``` code fences,
//            and a paragraph holding a single image becomes a <figure>
//   inline:  [links](url), ![images](src "caption"), **bold**, *italic*,
//            `code`, and line breaks (newline inside a paragraph)
//
// Options: `image({ alt, src, title, inline })` renders images, and
// `linkClass` is added to every link.
//
// Text is escaped. Images are resolved by the `image` option so the caller can
// turn a name into a responsive <picture>.

import { escape } from "./html.mjs";

const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

export function renderInline(text, options = {}) {
  const tokens = [];
  const stash = (s) => `\u0000${tokens.push(s) - 1}\u0000`;

  let s = String(text)
    // code first, so its content is left alone
    .replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escape(code)}</code>`))
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) =>
      stash(options.image ? options.image({ alt, src, title, inline: true }) : `<img src="${escape(src)}" alt="${escape(alt)}">`)
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const cls = options.linkClass ? ` class="${escape(options.linkClass)}"` : "";
      return stash(`<a${cls} href="${escape(href)}">${renderInline(label, options)}</a>`);
    });

  s = escape(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>\n");

  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)]);
}

export function renderMarkdown(source, options = {}) {
  const lines = String(source).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  const isBlank = (l) => /^\s*$/.test(l);
  const startsBlock = (l) => /^(#{1,6}\s|```|>\s?|\s*[-*]\s|\s*\d+\.\s)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) body.push(lines[i]);
      i++;
      const cls = lang ? ` class="language-${escape(lang)}"` : "";
      out.push(`<pre><code${cls}>${escape(body.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length, 6);
      out.push(`<h${level}>${renderInline(heading[2].trim(), options)}</h${level}>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const body = [];
      for (; i < lines.length && /^>\s?/.test(lines[i]); i++) body.push(lines[i].replace(/^>\s?/, ""));
      out.push(`<blockquote>${renderMarkdown(body.join("\n"), options)}</blockquote>`);
      continue;
    }

    const list = /^\s*([-*]|\d+\.)\s/.exec(line);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const items = [];
      for (; i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i]); i++) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "");
        // indented continuation lines belong to the item
        while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !/^\s*([-*]|\d+\.)\s/.test(lines[i + 1])) {
          item += " " + lines[++i].trim();
        }
        items.push(`<li>${renderInline(item, options)}</li>`);
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const para = [];
    for (; i < lines.length && !isBlank(lines[i]) && !(para.length && startsBlock(lines[i])); i++) para.push(lines[i]);
    const text = para.join("\n").trim();
    const image = IMAGE_ONLY.exec(text);
    if (image && options.image) {
      out.push(options.image({ alt: image[1], src: image[2], title: image[3], inline: false }));
    } else {
      out.push(`<p>${renderInline(text, options)}</p>`);
    }
  }

  return out.join("\n");
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
  return { data, body: String(source).slice(match[0].length) };
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
