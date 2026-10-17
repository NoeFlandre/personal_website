// Page shell: head, sprite, navigation, footer.

import { attrs, html, raw } from "../build/html.mjs";

// Prerender posts and prefetch other pages when a link is hovered or touched.
const SPECULATION_RULES = JSON.stringify({
  prerender: [{ where: { href_matches: "/posts/*" }, eagerness: "moderate" }],
  prefetch: [{ where: { and: [{ href_matches: "/*" }, { not: { href_matches: "/posts/*" } }] }, eagerness: "moderate" }],
});

export function renderPage(ctx, ui, page) {
  const { site } = ctx;
  const nav = renderNav(ui, page.current, page.progress);
  const footer = renderFooter(ui);
  const title = page.title ? `${page.title} | ${site.name}` : site.name;
  const description = page.description ?? site.description;
  const url = page.path ? site.url + page.path : null;

  return `<!DOCTYPE html>
${html`<html lang="${site.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="author" content="${site.name}">
  <meta name="theme-color" content="#01242e">${
    url
      ? html`
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${page.title ?? site.name}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${page.ogType ?? "website"}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${page.image ?? site.ogImage}">${
    page.published ? html`
  <meta property="article:published_time" content="${page.published}">` : ""
  }
  <meta name="twitter:card" content="${page.image ? "summary_large_image" : "summary"}">`
      : ""
  }
  <link rel="icon" href="${ctx.favicon}" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="${site.name}" href="/rss.xml">
  <link rel="preload" href="${ctx.font}" as="font" type="font/woff2" crossorigin>
  <style>${raw(ctx.css)}</style>
  <script type="speculationrules">${raw(SPECULATION_RULES)}</script>
  <script src="${ctx.script}" defer></script>
</head>
<body>
  ${ui.sprite()}
  <a class="skip-link" href="#main">Skip to content</a>

  ${nav}

  <main id="main">
    ${page.body}
  </main>

  ${footer}
</body>
</html>`}
`;
}

function renderNav(ui, current, progress) {
  const sections = ui.site.sections;
  const link = (s) => {
    const isCurrent = s.id === current?.id;
    return html`<a${attrs({
      class: `nav-link${isCurrent ? " is-current" : ""}`,
      "data-target": s.id,
      href: ui.href(s.id),
      "aria-current": isCurrent ? current.aria : null,
    })}>${s.label}</a>`;
  };
  const home = ui.href(sections[0].id);
  return html`<header class="nav" role="banner">${progress ? html`
    <span class="progress" aria-hidden="true"></span>` : ""}
    <div class="container nav-inner">
      <a class="nav-brand" href="${home}" aria-label="${ui.site.name}, home">
        <span class="nav-logo wordmark">${ui.wordmark("brand")}</span>
      </a>
      <button class="menu-button" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav-menu">
        <svg viewBox="0 0 41 32" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path class="bar-top" d="M0 1h41"/><path class="bar-mid" d="M0 16h41"/><path class="bar-bot" d="M0 31h41"/></svg>
      </button>
      <nav class="nav-menu" id="nav-menu" aria-label="Main">
        <div class="nav-pair">
          ${sections.slice(0, 2).map(link)}
        </div>
        <a class="nav-logo wordmark" href="${home}" aria-label="${ui.site.name}, home">${ui.wordmark("center")}</a>
        <div class="nav-pair nav-pair--right">
          ${sections.slice(2).map(link)}
        </div>
      </nav>
    </div>
  </header>`;
}

function renderFooter(ui) {
  const { site } = ui;
  const [first, last] = site.name.split(" ");
  return html`<footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>${ui.illustration("mark.svg", { width: 72, height: 46, className: "footer-mark" })}</div>
        <div class="footer-info">
          <div class="footer-row footer-row--signoff">
            <div class="footer-col"><p class="heading-3">${first}<br>${last}</p></div>
            <div class="footer-col"><p class="text-m">${site.role}</p></div>
          </div>
          <div class="footer-row">
            <div class="footer-col"><p class="heading-4">Explore</p></div>
            <div class="footer-col">
              ${site.sections.map((s) => html`<a href="${ui.href(s.id)}">${s.label}</a>`)}
            </div>
          </div>
          <div class="footer-row">
            <div class="footer-col"><p class="heading-4">Contact</p></div>
            <div class="footer-col"><a href="mailto:${site.email}">${site.email}</a></div>
          </div>
          <div class="footer-row">
            <div class="footer-col"><p class="heading-4">Connect</p></div>
            <div class="footer-col">
              ${site.footerLinks.map((id) => html`<a href="${site.links[id].url}">${site.links[id].footerLabel ?? site.links[id].label}</a>`)}
            </div>
          </div>
        </div>
        <div class="footer-wordmark wordmark" aria-hidden="true">
          ${ui.wordmark("full")}
        </div>
      </div>
      <div class="footer-end">
        <div>© ${site.year} ${site.name} · <a href="${site.source}">${site.license}</a></div>
        <div class="footer-links">
          <a href="/rss.xml">RSS</a><span>|</span>
          <a href="${site.cv}">CV</a><span>|</span>
          <a href="#main">Back to top ↑</a>
        </div>
      </div>
    </div>
    <div class="tagline-bar">
      <div class="container"><p class="tagline-text">${site.tagline}</p></div>
    </div>
  </footer>`;
}
