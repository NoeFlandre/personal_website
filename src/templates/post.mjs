// Blog post page.

import { html, raw } from "../build/html.mjs";
import { renderMarkdown } from "../build/markdown.mjs";

const SHARE = [
  ["X", (u) => `https://x.com/intent/post?url=${u}`],
  ["LinkedIn", (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
  ["WhatsApp", (u) => `https://wa.me/?text=${u}`],
];

export function renderPost(ctx, ui, post, { site }) {
  const section = site.sections.find((s) => s.id === "blog");
  const url = site.url + post.url;

  // Images are named relative to the post: ![Alt](name#maxWidth "Caption")
  // -> src/assets/img/posts/<post id>/name-<width>.<ext> or name.svg
  const figure = ({ alt, src, caption, priority }) => {
    const [name, maxWidth] = src.split("#");
    const style = maxWidth ? ` style="--figure-max: ${Number(maxWidth)}px"` : "";
    return html`<figure class="figure"${raw(style)}>${ui.picture(`posts/${post.id}/${name}`, {
      alt,
      sizes: `(max-width: 767px) calc(100vw - 32px), ${maxWidth ? `${Number(maxWidth)}px` : "720px"}`,
      loading: priority ? "eager" : "lazy",
      priority: priority ? "high" : null,
    })}${caption ? html`<figcaption>${raw(caption)}</figcaption>` : ""}</figure>`.value;
  };
  const hero = post.hero ? figure({ alt: post.heroAlt ?? "", src: post.hero, caption: post.heroCaption && html`${post.heroCaption}`.value, priority: true }) : "";
  const prose = renderMarkdown(post.body, { image: figure });

  const details = html`<p class="heading-4">Published</p>
                <p class="text-m"><time datetime="${post.date}">${post.dateLabel}</time></p>
                <p class="heading-4">Reading time</p>
                <p class="text-m">${post.readingTime} min</p>
                <p class="heading-4">Author</p>
                <p class="text-m">${site.name}</p>${
    post.tags.length
      ? html`
                <p class="heading-4">Tags</p>
                <p class="text-m">${post.tags.map((t) => html`<a class="tag" href="${t.url}">#${t.slug}</a> `)}</p>`
      : ""
  }`;

  const neighbour = (p, label, className) =>
    p
      ? html`<a class="post-next ${className}" href="${p.url}">
                  <span class="kicker">${label}</span>
                  <span class="heading-4">${p.title}</span>
                </a>`
      : "";

  const main = html`<p class="heading-3">${post.description}</p>
              <div class="post-details post-details--device">
                ${details}
              </div>
              <div class="prose">
                ${raw(hero)}
                ${raw(prose)}
              </div>
              <div class="post-meta-bar">
                <a class="link-arrow" href="${site.editBase}${post.id}.md">Edit on GitHub</a>
                <a class="link-arrow" href="#main">Back to top ↑</a>
              </div>
              <div class="share" aria-label="Share this post">
                <span class="meta">Share this post:</span>
                ${SHARE.map(([label, link]) => html`<a href="${link(encodeURIComponent(url))}">${label}</a>`)}
                <button class="btn" type="button" data-copy="${url}">${ui.icon("link")}<span>Copy link</span></button>
              </div>${
    post.newer || post.older
      ? html`
              <nav class="post-pager" aria-label="More posts">
                ${neighbour(post.newer, "← Newer post", "post-next--newer")}
                ${neighbour(post.older, "Older post →", "post-next--older")}
              </nav>`
      : ""
  }
              <p><a class="link-arrow" href="/posts">← All posts</a></p>`;

  const body = ui.chapter({
    section,
    hero: {
      tag: "h1",
      titleId: "post-title",
      anchor: false,
      number: false,
      half: true,
      className: "hero--post",
      titleText: html`<a href="/posts">← ${section.label}</a>`,
      heading: post.title,
      art: ui.blogArt(),
    },
    content: {
      tag: "article",
      progress: true,
      number: "Post",
      body: ui.contentGrid({
        number: "Post",
        side: html`<div class="post-details post-details--desktop">
                ${details}
              </div>`,
        main,
      }),
    },
  });

  return {
    path: post.url,
    title: post.title,
    description: post.description,
    ogType: "article",
    published: post.date,
    image: post.hero ? ui.socialImage(`posts/${post.id}/${post.hero}`) : null,
    stylesheets: prose.includes('class="katex') ? [ctx.mathStylesheet()] : [],
    current: { id: section.id, aria: "page" },
    progress: true,
    body,
  };
}
