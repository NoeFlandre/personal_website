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

    let monthMap = yearMap.get(year);
    if (!monthMap) {
      monthMap = new Map();
      yearMap.set(year, monthMap);
    }

    let groupedPosts = monthMap.get(month);
    if (!groupedPosts) {
      groupedPosts = [];
      monthMap.set(month, groupedPosts);
    }

    groupedPosts.push(post);
  }

  return Array.from(yearMap.entries()).map(([year, monthMap]) => ({
    year,
    months: Array.from(monthMap.entries()).map(([month, groupedPosts]) => ({
      month,
      posts: groupedPosts,
    })),
  }));
}
