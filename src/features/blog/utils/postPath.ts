import type { CollectionEntry } from "astro:content";

import { getPath } from "./getPath.ts";

export function getPostPath(
  post: Pick<CollectionEntry<"blog">, "id" | "filePath">,
  includeBase = true
) {
  return getPath(post.id, post.filePath, includeBase);
}
