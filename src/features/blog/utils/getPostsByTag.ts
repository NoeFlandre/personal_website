import type { CollectionEntry } from "astro:content";
import { slugifyAll } from "../../../utils/slugify.ts";
import getSortedPosts from "./getSortedPosts.ts";

const getPostsByTag = (posts: CollectionEntry<"blog">[], tag: string) =>
  getSortedPosts(posts.filter((post) => slugifyAll(post.data.tags).includes(tag)));

export default getPostsByTag;
