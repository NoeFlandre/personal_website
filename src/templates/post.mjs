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

  const figure = ({ alt, src, title }) =>
    html`<figure class="figure">${ui.picture(src, {
      alt,
      sizes: "(max-width: 767px) calc(100vw - 32px), 720px",
    })}${title ? html`<figcaption>${title}</figcaption>` : ""}</figure>`.value;

  const details = html`<p class="heading-4">Published</p>
                <p class="text-m"><time datetime="${post.date}">${post.dateLabel}</time></p>
                <p class="heading-4">Reading time</p>
                <p class="text-m">${post.readingTime} min</p>
                <p class="heading-4">Author</p>
                <p class="text-m">${site.name}</p>${
    post.tags.length
      ? html`
                <p class="heading-4">Tags</p>
                <p class="text-m">${post.tags.map((t) => html`<a class="tag" href="${site.url}/tags/${t}">#${t}</a> `)}</p>`
      : ""
  }`;

  const main = html`<p class="heading-3">${post.description}</p>
              <div class="post-details post-details--device">
                ${details}
              </div>
              <div class="prose">
                ${raw(renderMarkdown(post.body, { image: figure }))}
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
    post.next
      ? html`
              <a class="post-next" href="${post.next.url}">
                <span class="kicker">Next post →</span>
                <span class="heading-4">${post.next.title}</span>
              </a>`
      : ""
  }
              <p><a class="link-arrow" href="${ui.href("blog")}">← All posts</a></p>`;

  const body = ui.chapter({
    section,
    hero: {
      tag: "h1",
      titleId: "post-title",
      anchor: false,
      number: false,
      half: true,
      className: "hero--post",
      titleText: html`<a href="${ui.href("blog")}">← ${section.label}</a>`,
      heading: post.title,
      art: html`<div class="hero-art hero-art--blog-top" aria-hidden="true">${ui.illustration("blog-lamp.svg", { width: 288, height: 300 })}</div>
        <div class="hero-art hero-art--blog" aria-hidden="true">${ui.illustration("blog-block.svg", { width: 288, height: 290 })}</div>`,
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
    image: `${url}og.png`,
    current: { id: section.id, aria: "page" },
    progress: true,
    body,
  };
}
