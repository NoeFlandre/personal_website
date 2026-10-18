// Lists of posts: /posts (all), /tags/<tag> (one tag) and /tags (the tags).

import { html } from "../build/html.mjs";

export function renderPostList(ctx, ui, { posts, tags, tag }) {
  const section = ui.site.sections.find((s) => s.id === "blog");
  const shown = tag ? tag.posts : posts;

  const filters = html`<nav class="tag-filter" aria-label="Filter by tag">
                <a href="/posts"${tag ? "" : html` aria-current="page"`}><span>All</span><span class="cv-index-count">${pad(posts.length)}</span></a>
                ${tags.map(
                  (t) => html`<a href="${t.url}"${t === tag ? html` aria-current="page"` : ""}><span>${t.name}</span><span class="cv-index-count">${pad(t.posts.length)}</span></a>`
                )}
              </nav>`;

  const years = [];
  for (const post of shown) {
    const year = post.date.slice(0, 4);
    if (years.at(-1)?.year !== year) years.push({ year, posts: [] });
    years.at(-1).posts.push(post);
  }

  return page(ui, section, {
    path: tag ? tag.url : "/posts",
    title: tag ? `Posts tagged #${tag.slug}` : "All posts",
    heading: tag ? `Posts tagged #${tag.slug}.` : "Every note from the lab.",
    label: tag ? `${tag.name} posts` : "All posts",
    number: pad(shown.length),
    side: filters,
    main: html`${years.map(
      (y) => html`<section class="post-year" aria-labelledby="year-${y.year}">
                <h2 class="post-year-title" id="year-${y.year}">${y.year}</h2>
                <div class="post-list">
                  ${y.posts.map((p) => ui.postItem(p))}
                </div>
              </section>`
    )}
              <p class="link-row"><a class="link-arrow" href="/rss.xml">RSS feed</a></p>`,
  });
}

export function renderTagIndex(ctx, ui, { tags }) {
  const section = ui.site.sections.find((s) => s.id === "blog");
  return page(ui, section, {
    path: "/tags",
    title: "Tags",
    heading: "Posts by tag.",
    label: "Tags",
    number: pad(tags.length),
    main: html`<ul class="tag-list">
                ${tags.map(
                  (t) => html`<li><a class="heading-3" href="${t.url}">#${t.slug}</a> <span class="meta">${t.posts.length} ${t.posts.length === 1 ? "post" : "posts"}</span></li>`
                )}
              </ul>
              <p class="link-row"><a class="link-arrow" href="/posts">All posts →</a></p>`,
  });
}

function page(ui, section, { path, title, heading, label, number, side, main }) {
  return {
    path,
    title,
    description: `${title}: notes by ${ui.site.name} on AI research, geospatial data and more.`,
    current: { id: section.id, aria: "page" },
    body: ui.chapter({
      section,
      hero: {
        tag: "h1",
        titleId: "list-title",
        anchor: false,
        number: false,
        half: true,
        className: "hero--post",
        titleText: html`<a href="${ui.href(section.id)}">← ${section.label}</a>`,
        heading,
        art: ui.blogArt(),
      },
      content: {
        label,
        number,
        body: ui.contentGrid({ number, side, main, className: "list-grid" }),
      },
    }),
  };
}

const pad = (n) => String(n).padStart(2, "0");
