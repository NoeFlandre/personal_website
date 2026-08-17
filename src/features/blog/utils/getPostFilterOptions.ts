import type { TagInfo } from "./tags.ts";
import { getTagPath } from "./tags.ts";

export interface PostFilterOption {
  label: string;
  href: string;
  active: boolean;
}

export function getPostFilterOptions(tags: TagInfo[], activeTag?: string): PostFilterOption[] {
  const currentTag = activeTag?.trim() || undefined;

  return [
    {
      label: "All Posts",
      href: currentTag ? "/posts" : "#main-content",
      active: currentTag === undefined,
    },
    ...tags.map(({ tag, tagName }) => ({
      label: tagName,
      href: tag === currentTag ? "/posts" : getTagPath(tagName),
      active: tag === currentTag,
    })),
  ];
}
