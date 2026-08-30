import type { CollectionEntry } from "astro:content";

type GroupKey = string | number | symbol;

type GroupFunction<T> = (item: T, index?: number) => GroupKey;

const getPostsByGroupCondition = (
  posts: CollectionEntry<"blog">[],
  groupFunction: GroupFunction<CollectionEntry<"blog">>
) => {
  const groups = new Map<GroupKey, CollectionEntry<"blog">[]>();
  for (const [index, item] of posts.entries()) {
    const groupKey = groupFunction(item, index);
    const group = groups.get(groupKey);
    if (group) {
      group.push(item);
    } else {
      groups.set(groupKey, [item]);
    }
  }

  return Object.fromEntries(groups);
};

export default getPostsByGroupCondition;
