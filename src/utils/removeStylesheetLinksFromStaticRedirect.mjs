const stylesheetLinkPattern = /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi;

export function removeStylesheetLinksFromStaticRedirect(html) {
  if (!html.includes("data-static-redirect")) {
    return html;
  }

  return html.replace(stylesheetLinkPattern, "");
}
