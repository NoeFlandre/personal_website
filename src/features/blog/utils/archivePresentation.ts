import type { ArchiveMonthGroup } from "./getArchiveGroups.ts";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function countArchivePosts(monthGroups: ArchiveMonthGroup[]): number {
  return monthGroups.reduce((count, monthGroup) => count + monthGroup.posts.length, 0);
}
