import type { CollectionEntry } from "astro:content";

import getSortedPosts from "./getSortedPosts.ts";

export interface ArchiveMonthGroup {
  month: number;
  posts: CollectionEntry<"blog">[];
}

export interface ArchiveYearGroup {
  year: number;
  months: ArchiveMonthGroup[];
}

export function getArchiveGroups(posts: CollectionEntry<"blog">[]): ArchiveYearGroup[] {
  const sortedPosts = getSortedPosts(posts);
  const yearMap = new Map<number, Map<number, CollectionEntry<"blog">[]>>();

  for (const post of sortedPosts) {
    const pubDate = new Date(post.data.pubDatetime);
    const year = pubDate.getFullYear();
    const month = pubDate.getMonth() + 1;

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map());
    }

    const monthMap = yearMap.get(year);
    if (!monthMap?.has(month)) {
      monthMap?.set(month, []);
    }

    monthMap?.get(month)?.push(post);
  }

  return Array.from(yearMap.entries())
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, monthMap]) => ({
      year,
      months: Array.from(monthMap.entries())
        .sort(([monthA], [monthB]) => monthB - monthA)
        .map(([month, groupedPosts]) => ({
          month,
          posts: groupedPosts,
        })),
    }));
}
