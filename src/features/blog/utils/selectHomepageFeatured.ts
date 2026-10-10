import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts.ts";

interface HomepageFeaturedOptions {
  ids: string[];
  minYear: number;
}

const selectHomepageFeatured = (
  posts: CollectionEntry<"blog">[],
  { ids, minYear }: HomepageFeaturedOptions
) => {
  return getSortedPosts(posts)
    .filter(({ data }) => data.pubDatetime.getFullYear() >= minYear)
    .filter(({ id }) => ids.includes(id))
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
};

export default selectHomepageFeatured;
