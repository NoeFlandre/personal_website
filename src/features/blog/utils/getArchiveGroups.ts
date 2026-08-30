import type { CollectionEntry } from "astro:content";

import { groupBy } from "./groupBy.ts";
import { getPostsByYear } from "./markdownIndexes.ts";

export interface ArchiveMonthGroup {
  month: number;
  posts: CollectionEntry<"blog">[];
}

export interface ArchiveYearGroup {
  year: number;
  months: ArchiveMonthGroup[];
}

export function getArchiveGroups(posts: CollectionEntry<"blog">[]): ArchiveYearGroup[] {
  return getPostsByYear(posts).map(({ year, posts: postsInYear }) => {
    const postsByMonth = groupBy(
      postsInYear,
      (post) => new Date(post.data.pubDatetime).getMonth() + 1
    );

    return {
      year,
      months: Array.from(postsByMonth, ([month, monthPosts]) => ({
        month,
        posts: monthPosts,
      })).sort((a, b) => b.month - a.month),
    };
  });
}
