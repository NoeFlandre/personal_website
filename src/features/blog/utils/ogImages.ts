import type { CollectionEntry } from "astro:content";

export function shouldGenerateDynamicOgImage(post: Pick<CollectionEntry<"blog">, "data">): boolean {
  return !post.data.draft && !post.data.ogImage;
}
