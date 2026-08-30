import type { CollectionEntry } from "astro:content";

import { groupBy } from "./groupBy.ts";

type GroupKey = PropertyKey;

type GroupFunction<T> = (item: T, index?: number) => GroupKey;

const getPostsByGroupCondition = (
  posts: CollectionEntry<"blog">[],
  groupFunction: GroupFunction<CollectionEntry<"blog">>
) => {
  return Object.fromEntries(groupBy(posts, groupFunction));
};

export default getPostsByGroupCondition;
