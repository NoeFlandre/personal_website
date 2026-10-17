// RSS feed, sitemap and robots.txt.

import { escape } from "./html.mjs";

export function renderRss({ site, posts }) {
  const items = posts
    .map((p) => {
      const link = site.url + p.url;
      return [
        "    <item>",
        `      <title>${escape(p.title)}</title>`,
        `      <link>${escape(link)}</link>`,
        `      <guid isPermaLink="true">${escape(link)}</guid>`,
        `      <description>${escape(p.description)}</description>`,
        `      <pubDate>${new Date(`${p.date}T07:00:00Z`).toUTCString()}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.name)}</title>
    <link>${escape(site.url)}/</link>
    <description>${escape(site.description)}</description>
    <language>${escape(site.lang)}</language>
    <atom:link href="${escape(site.url)}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

export function renderSitemap({ site, paths }) {
  const urls = paths.map((p) => `  <url><loc>${escape(site.url + p)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function renderRobots({ site }) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;
}
