import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter.ts";
import { createTagInfo } from "./tags.ts";

const getUniqueTags = (posts: CollectionEntry<"blog">[]) => {
  const tags = posts
    .filter(postFilter)
    .flatMap((post) => post.data.tags)
    .map((tag) => createTagInfo(tag))
    .filter((value, index, self) => self.findIndex((tag) => tag.tag === value.tag) === index)
    .sort((tagA, tagB) => tagA.tag.localeCompare(tagB.tag));
  return tags;
};

export default getUniqueTags;
