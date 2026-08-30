import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter.ts";
import { createTagInfo, type TagInfo } from "./tags.ts";

export function getUniqueTagInfos(tagNames: string[]): TagInfo[] {
  const uniqueTags = new Map<string, TagInfo>();

  for (const tagName of tagNames) {
    const tagInfo = createTagInfo(tagName);
    if (!uniqueTags.has(tagInfo.tag)) {
      uniqueTags.set(tagInfo.tag, tagInfo);
    }
  }

  return [...uniqueTags.values()];
}

const getUniqueTags = (posts: CollectionEntry<"blog">[]) => {
  const tags = getUniqueTagInfos(posts.filter(postFilter).flatMap((post) => post.data.tags)).sort(
    (tagA, tagB) => tagA.tag.localeCompare(tagB.tag)
  );
  return tags;
};

export default getUniqueTags;
