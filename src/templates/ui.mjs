// Per-page UI kit. Templates call these helpers while rendering; the kit keeps
// track of which icons and wordmarks were used so the page ships only those
// symbols in its sprite.

import { attrs, html, raw } from "../build/html.mjs";
import { renderInline } from "../build/markdown.mjs";

export function createUi({ site, assets, isHome }) {
  const icons = assets.data("icons.json");
  const wordmark = assets.data("wordmark.json");
  const usedIcons = new Set();
  let usedNoe = false;

  const ui = {
    site,
    // Section anchors live on the home page.
    href: (id) => (isHome ? `#${id}` : `/#${id}`),

    md: (text, options) => raw(renderInline(text, options)),

    icon(name, className = "icon") {
      if (!icons[name]) throw new Error(`Unknown icon "${name}"`);
      usedIcons.add(name);
      return html`<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
    },

    // "brand": left-aligned (tablet/phone bar); "center": desktop menu; "full": footer.
    wordmark(variant) {
      if (variant === "full") {
        return html`<svg viewBox="${wordmark.full.viewBox}" aria-hidden="true"><path d="${wordmark.full.d}"/></svg>`;
      }
      usedNoe = true;
      const x = variant === "center" ? wordmark.noe.centerX : 0;
      return html`<svg viewBox="${wordmark.noe.viewBox}" aria-hidden="true"><use href="#wm-noe"${attrs({ x: x || null })}/></svg>`;
    },

    // Decorative SVG drawings, inlined as data URIs (no extra requests).
    illustration(file, { width, height, className }) {
      return html`<img${attrs({ class: className, src: assets.dataUri(`img/${file}`), alt: "", width, height })}>`;
    },

    picture(name, { alt, sizes, className, loading = "lazy", priority }) {
      const img = assets.image(name);
      return html`<picture>${img.sources.map(
        (s) => html`<source type="${s.type}" srcset="${s.srcset}" sizes="${sizes}">`
      )}<img${attrs({
        class: className,
        src: img.fallback,
        alt,
        width: img.width,
        height: img.height,
        loading,
        decoding: "async",
        fetchpriority: priority,
      })}></picture>`;
    },

    sectionTitle({ text, number }) {
      return html`<div class="section-title">
            <div class="section-title-text">${text}</div>
            <span class="dot" aria-hidden="true"></span>${number ? html`
            <div class="section-title-no">${number}</div>` : ""}
          </div>`;
    },

    endRow() {
      return html`<div class="end-row" aria-hidden="true">
            <span class="marker"></span>
            <span class="dot"></span>
          </div>`;
    },

    // A coloured hero band followed by its dark content section.
    chapter({ section, number, hero, content }) {
      const titleText = hero.titleText ?? section.label;
      const titleId = hero.titleId ?? `${section.id}-title`;
      const tag = hero.tag ?? "h2";
      const heading = raw(`<${tag} class="heading-1${hero.half ? " is-half" : ""}" id="${titleId}">${html`${hero.heading}`}</${tag}>`);
      const contentTag = content.tag ?? "section";
      return html`<div data-chapter="${section.id}" data-color="${section.navColor}">
      <section class="hero hero--${section.id}${hero.className ? ` ${hero.className}` : ""}"${attrs({ id: hero.anchor === false ? null : section.id })} aria-labelledby="${titleId}">
        <div class="container">
          ${ui.sectionTitle({ text: titleText, number: hero.number === false ? null : number })}
          ${heading}${hero.extra ?? ""}
        </div>
        ${hero.art ?? ""}
      </section>

      ${raw(`<${contentTag} class="content content--${section.id}"${content.label ? ` aria-label="${content.label}"` : ""}${content.progress ? " data-progress" : ""}>`)}
        <div class="container">
          ${ui.sectionTitle({ text: section.label, number: content.number ?? number })}
          ${content.body}
          ${ui.endRow()}
        </div>
      ${raw(`</${contentTag}>`)}
    </div>`;
    },

    // The usual three-column content layout: number column + main column.
    contentGrid({ number, side, main, className }) {
      return html`<div class="content-grid${className ? ` ${className}` : ""}">
            <div><div class="number-block">${number}</div>${side ?? ""}</div>
            <div class="content-block">
              ${main}
            </div>
          </div>`;
    },

    // Symbols for everything used on this page. Render it last.
    sprite() {
      const symbols = [...usedIcons].sort().map((name) => {
        const { viewBox, body } = icons[name];
        return raw(`<symbol id="i-${name}" viewBox="${viewBox}">${body}</symbol>`);
      });
      const defs = usedNoe ? html`<defs><path id="wm-noe" d="${wordmark.noe.d}"/></defs>` : "";
      return html`<svg width="0" height="0" style="position:absolute" aria-hidden="true">${defs}${symbols}</svg>`;
    },
  };
  return ui;
}
