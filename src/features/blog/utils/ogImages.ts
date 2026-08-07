import type { CollectionEntry } from "astro:content";
import { isPostRoutable } from "./postFilter.ts";

export function shouldGenerateDynamicOgImage(post: Pick<CollectionEntry<"blog">, "data">): boolean {
  return isPostRoutable(post.data) && !post.data.ogImage;
}
