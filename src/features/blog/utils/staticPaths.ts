import type { CollectionEntry } from "astro:content";

import { getPath } from "./getPath.ts";

export function getPostStaticPathParams(post: Pick<CollectionEntry<"blog">, "id" | "filePath">) {
  const path = getPath(post.id, post.filePath, false);
  return {
    slug: path.slice(1),
  };
}
