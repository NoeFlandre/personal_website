// 404 page.

import { html } from "../build/html.mjs";

export function renderNotFound(ctx, ui, { site }) {
  const section = site.sections[0];
  return {
    title: "Page not found",
    body: html`<div data-chapter="${section.id}" data-color="${section.navColor}">
      <section class="hero hero--${section.id}" aria-labelledby="nf-title">
        <div class="container">
          ${ui.sectionTitle({ text: "404", number: "404" })}
          <h1 class="heading-1" id="nf-title">This place is not on the map.</h1>
          <p class="hero-sub">The page you are looking for does not exist. <a href="/">Go back home →</a></p>
        </div>
        <div class="hero-art hero-art--${section.id}">${ui.illustration("hero-about.svg", { width: 810, height: 530 })}</div>
      </section>
    </div>`,
  };
}
