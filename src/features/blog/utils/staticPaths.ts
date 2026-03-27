import type { CollectionEntry } from "astro:content";

import { getPath } from "./getPath.ts";

export function getPostStaticPathParams(post: Pick<CollectionEntry<"blog">, "id" | "filePath">) {
  return {
    slug: getPath(post.id, post.filePath, false),
  };
}
