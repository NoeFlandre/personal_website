export const AIRBUS_GEO_EXPLORE_URL =
  "https://space-solutions.airbus.com/resources/news/various/airbus-geo-explore-early-testing-programme/";

/** Arguments are inserted as-is, so pass HTML-escaped values (for example `&amp;`). */
export const externalLink = (href: string, text: string): string =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

export const authorLink = (href: string, name: string): string =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer" class="underline decoration-accent/30 underline-offset-4 hover:text-accent">${name}</a>`;
