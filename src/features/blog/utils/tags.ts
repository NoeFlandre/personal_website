import type { CollectionEntry } from "astro:content";

import { slugifyAll, slugifyStr } from "../../../utils/slugify.ts";

export interface TagInfo {
  tag: string;
  tagName: string;
}

/**
 * Builds the canonical tag object used by blog tag listings.
 */
export function createTagInfo(tagName: string): TagInfo {
  return {
    tag: slugifyStr(tagName),
    tagName,
  };
}

export function getTagPath(tagName: string): string {
  return `/tags/${slugifyStr(tagName)}`;
}

/**
 * Checks whether a blog post contains the provided normalized tag slug.
 */
export function postHasTag(post: CollectionEntry<"blog">, normalizedTag: string): boolean {
  return slugifyAll(post.data.tags).includes(normalizedTag);
}
