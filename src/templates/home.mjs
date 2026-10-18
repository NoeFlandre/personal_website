// Home page: About, CV, Blog and Contact chapters.

import { html, raw } from "../build/html.mjs";

const pad = (n) => String(n).padStart(2, "0");

export function renderHome(ctx, ui, content) {
  const { site, home, cv, posts } = content;
  const section = (id) => site.sections.find((s) => s.id === id);
  const chapters = [
    renderAbout(ui, section("about"), home.about),
    renderCv(ui, section("cv"), home.cv, cv),
    renderBlog(ui, section("blog"), home.blog, posts),
    renderContact(ui, section("contact"), home.contact),
  ];
  return {
    path: "/",
    current: { id: site.sections[0].id, aria: "true" },
    body: chapters.map((c, i) => html`<!-- ${pad(i + 1)} ${site.sections[i].label} -->
    ${c}`),
  };
}

function renderAbout(ui, section, about) {
  const { site } = ui;
  const links = [
    ...site.heroLinks.map((id) => ({ ...site.links[id], icon: id })),
    { label: "Email", url: `mailto:${site.email}`, icon: "mail" },
    { label: "CV (PDF)", url: site.cv, icon: "doc" },
    { label: "RSS feed", url: "/rss.xml", icon: "rss" },
  ];
  const socials = html`
          <p class="hero-sub">${site.role}</p>
          <ul class="socials" aria-label="Find me elsewhere">
            ${links.map((l) => html`<li><a href="${l.url}" aria-label="${l.label}" title="${l.label}">${ui.icon(l.icon)}</a></li>`)}
          </ul>`;

  return ui.chapter({
    section,
    number: "01",
    hero: {
      tag: "h1",
      heading: about.headline,
      extra: socials,
      art: html`<div class="hero-art hero-art--about">${ui.illustration("hero-about.svg", { width: 810, height: 530 })}</div>`,
    },
    content: {
      label: "About me",
      body: html`<div class="content-grid about-grid">
            <div class="about-top">
              <div class="about-media">
                <div class="number-block">01</div>
                ${ui.picture(about.portrait.image, {
                  alt: about.portrait.alt,
                  className: "portrait",
                  sizes: "(max-width: 767px) calc(100vw - 32px), (max-width: 991px) 200px, 220px",
                })}
              </div>
              <div class="content-block">
                ${about.bio.map((p) => html`<p class="heading-3">${ui.md(p, { linkClass: "link-accent" })}</p>`)}
              </div>
            </div>
          </div>`,
    },
  });
}

function renderCv(ui, section, intro, cv) {
  const groups = cv.groups;
  const id = (g) => `cv-${g.id}`;

  const index = html`<nav class="cv-index" aria-label="CV sections">
                <ul data-tabs>
                  ${groups.map(
                    (g) => html`<li><a href="#${id(g)}"><span>${g.label}</span><span class="cv-index-count">${pad(g.items.length)}</span></a></li>`
                  )}
                </ul>
                <a class="link-arrow" href="${cv.pdf}">Download CV (PDF)</a>
              </nav>`;

  const entry = (item, kind) => {
    const title = item.url ? html`<a href="${item.url}">${item.title}</a>` : item.title;
    if (kind === "publication") {
      const authors = item.authors.map((a, i) => html`${i ? ", " : ""}${a === cv.me ? html`<strong>${a}</strong>` : a}`);
      return html`<li class="entry">
                    <p class="entry-when">${item.year} · ${item.venue}</p>
                    <h4 class="entry-title">${title}</h4>
                    <p class="entry-text">${authors}</p>${item.note ? html`
                    <p class="note">${item.note}</p>` : ""}
                  </li>`;
    }
    const when = [item.when, item.where].filter(Boolean).join(" · ");
    const more = item.more
      ? html`
                    <details class="entry-more"><summary>More</summary><div class="entry-text">${ui.md(item.more)}</div></details>`
      : "";
    const coursework = item.coursework
      ? html`
                    <details class="entry-more"><summary>Coursework</summary><dl class="coursework">${item.coursework.map(
                      (c) => html`<dt>${c.label}</dt><dd>${c.items}</dd>`
                    )}</dl></details>`
      : "";
    return html`<li class="entry">
                    <p class="entry-when">${when}</p>
                    <h4 class="entry-title">${title}</h4>${item.text ? html`
                    <p class="entry-text">${ui.md(item.text)}</p>` : ""}${more}${coursework}
                  </li>`;
  };

  // Quotes, one at a time.
  const recommendations = (g) => {
    const recs = g.items;
    return html`<div class="recs" data-carousel aria-roledescription="carousel" aria-label="${g.label}">
                  <div class="recs-stage">
                    ${recs.map(
                      (r, i) => html`<figure class="rec${i === 0 ? " is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${recs.length}"${raw(i ? ' aria-hidden="true"' : "")}>
                      <blockquote class="rec-quote" lang="${r.lang}">“${r.quote}”</blockquote>
                      <figcaption class="rec-by">
                        <a href="${r.url}">${r.name}</a>
                        <span class="meta">${r.role}</span>
                        <span class="meta">${r.relation} · ${r.date}</span>
                      </figcaption>
                    </figure>`
                    )}
                  </div>
                  <div class="recs-nav">
                    <button class="recs-btn" type="button" data-step="-1" aria-label="Previous recommendation">←</button>
                    <p class="recs-count" aria-live="polite"><span data-current>01</span> / ${pad(recs.length)}</p>
                    <button class="recs-btn" type="button" data-step="1" aria-label="Next recommendation">→</button>
                  </div>
                </div>`;
  };

  const panels = groups.map((g, i) => {
    const prev = groups[i - 1];
    const next = groups[i + 1];
    return html`<section class="cv-group" id="${id(g)}" aria-labelledby="${id(g)}-title">
                <h3 class="cv-heading" id="${id(g)}-title"><span>${g.label}</span><span class="cv-heading-count">${pad(g.items.length)}</span></h3>
                ${g.kind === "recommendation" ? recommendations(g) : html`<ol class="cv-list">
                  ${g.items.map((item) => entry(item, g.kind))}
                </ol>`}
                <p class="cv-pager">${prev ? html`<a class="link-arrow" href="#${id(prev)}">← ${prev.label}</a>` : ""}${
      next ? html`<a class="link-arrow cv-pager-next" href="#${id(next)}">${next.label} →</a>` : ""
    }</p>
              </section>`;
  });

  return ui.chapter({
    section,
    number: "02",
    hero: {
      heading: intro.headline,
      art: html`<div class="hero-art hero-art--cv" aria-hidden="true"></div>`,
    },
    content: {
      label: "Curriculum vitae",
      body: ui.contentGrid({ number: "02", className: "cv-grid", side: index, main: panels }),
    },
  });
}

function renderBlog(ui, section, blog, posts) {
  const featured = blog.featured.map((id) => {
    const post = posts.find((p) => p.id === id);
    if (!post) throw new Error(`home.json: featured post "${id}" not found`);
    return post;
  });

  return ui.chapter({
    section,
    number: "03",
    hero: {
      heading: blog.headline,
      half: true,
      art: ui.blogArt(),
    },
    content: {
      label: "Featured blog posts",
      body: ui.contentGrid({
        number: "03",
        main: html`<div class="post-list">
                ${featured.map((p) => ui.postItem(p))}
              </div>
              <p class="link-row">
                <a class="link-arrow" href="/posts">All ${posts.length} posts →</a>
                <a class="link-arrow" href="/rss.xml">RSS feed</a>
              </p>`,
      }),
    },
  });
}

function renderContact(ui, section, contact) {
  const { email } = ui.site;
  return ui.chapter({
    section,
    number: "04",
    hero: {
      heading: contact.headline,
      art: html`<div class="hero-art hero-art--contact" aria-hidden="true">${ui.illustration("hero-contact.svg", { width: 1440, height: 540 })}</div>`,
    },
    content: {
      label: "Contact details",
      body: ui.contentGrid({
        number: "04",
        main: html`<p class="heading-3">${contact.intro}</p>
              <div class="link-row">
                <p class="heading-3">Write to me at <a class="link-accent" href="mailto:${email}">${email}</a></p>
                <button class="btn" type="button" data-copy="${email}">${ui.icon("copy")}<span>Copy</span></button>
              </div>`,
      }),
    },
  });
}
