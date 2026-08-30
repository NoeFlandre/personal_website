import type { CollectionEntry } from "astro:content";

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
    const postsByMonth = new Map<number, CollectionEntry<"blog">[]>();

    for (const post of postsInYear) {
      const month = new Date(post.data.pubDatetime).getMonth() + 1;
      const monthPosts = postsByMonth.get(month);

      if (monthPosts) {
        monthPosts.push(post);
      } else {
        postsByMonth.set(month, [post]);
      }
    }

    return {
      year,
      months: Array.from(postsByMonth, ([month, monthPosts]) => ({
        month,
        posts: monthPosts,
      })).sort((a, b) => b.month - a.month),
    };
  });
}
