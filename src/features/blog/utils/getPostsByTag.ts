import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts.ts";
import { postHasTag } from "./tags.ts";

const getPostsByTag = (posts: CollectionEntry<"blog">[], tag: string) =>
  getSortedPosts(posts.filter((post) => postHasTag(post, tag)));

export default getPostsByTag;
