/**
 * Mirrors the site's existing structured-data word-count behavior so all
 * consumers derive the same count from post bodies.
 */
export function countWords(content: string): number {
  return content.split(/\s+/).length;
}
