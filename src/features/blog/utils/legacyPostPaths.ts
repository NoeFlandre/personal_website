import { SITE } from "../../../site-config.js";

// Posts that moved from the blog root into year folders: current path -> path before the move.
// vercel.json redirects the old paths. The RSS feed keeps the old URL as each item's guid, so
// feed readers still recognise these posts instead of showing them as new.
export const LEGACY_POST_PATHS = new Map<string, string>([
  ["/posts/2026/design-of-experiments", "/posts/design-of-experiments"],
  ["/posts/2026/osm-data-analysis", "/posts/osm-data-analysis"],
  ["/posts/2026/monopoly", "/posts/monopoly"],
  [
    "/posts/2026/describe-place-on-earth-part1-wikidata",
    "/posts/describe-place-on-earth-part1-wikidata",
  ],
  ["/posts/2026/distilling_abms", "/posts/distilling_abms"],
  ["/posts/2026/editor-pick-empathy-simulation", "/posts/editor-pick-empathy-simulation"],
  ["/posts/2026/first-review", "/posts/first-review"],
  ["/posts/2026/georeasoner", "/posts/georeasoner"],
  ["/posts/2026/giving-agents-hands", "/posts/giving-agents-hands"],
  ["/posts/2026/how2bench", "/posts/how2bench"],
  ["/posts/2026/hugging-face-language-tags", "/posts/hugging-face-language-tags"],
  ["/posts/2026/joining_evergreen", "/posts/joining_evergreen"],
  ["/posts/2026/starting-youtube-channel", "/posts/starting-youtube-channel"],
  ["/posts/2026/survival_guide_in_ai", "/posts/survival_guide_in_ai"],
]);

/**
 * Absolute URL of the pre-move address, or undefined for posts that never moved.
 * Feed links carry a trailing slash (the RSS library's default), so the guid must too,
 * or readers would see a different item than the one they already have.
 */
export function getLegacyFeedGuid(postPath: string): string | undefined {
  const previousPath = LEGACY_POST_PATHS.get(postPath);
  return previousPath === undefined ? undefined : new URL(`${previousPath}/`, SITE.website).href;
}
