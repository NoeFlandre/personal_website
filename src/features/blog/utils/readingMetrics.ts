/**
 * Counts whitespace-separated words, ignoring leading and trailing whitespace.
 */
export function countWords(content: string): number {
  const trimmed = content.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}
