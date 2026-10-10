import { type CollectionEntry, getCollection } from "astro:content";

import { getPostStaticPathParams } from "./staticPaths.ts";

export async function getPostStaticPaths(filter: (post: CollectionEntry<"blog">) => boolean) {
  const posts = await getCollection("blog", filter);

  return posts.map((post) => ({
    params: getPostStaticPathParams(post),
    props: { post },
  }));
}
