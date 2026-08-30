import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts.ts";
import { getPostPath } from "./postPath.ts";

export interface PostsByYear {
  year: number;
  posts: CollectionEntry<"blog">[];
}

export function getPostsByYear(posts: CollectionEntry<"blog">[]): PostsByYear[] {
  const postsByYear = new Map<number, CollectionEntry<"blog">[]>();

  for (const post of getSortedPosts(posts)) {
    const year = new Date(post.data.pubDatetime).getFullYear();
    const yearPosts = postsByYear.get(year);

    if (yearPosts) {
      yearPosts.push(post);
    } else {
      postsByYear.set(year, [post]);
    }
  }

  return Array.from(postsByYear, ([year, yearPosts]) => ({ year, posts: yearPosts })).sort(
    (a, b) => b.year - a.year
  );
}

export function buildPostsMarkdown(posts: CollectionEntry<"blog">[]) {
  const postsByYear = getPostsByYear(posts);
  let markdownContent = "# All Posts\n\n";

  for (const { year, posts: postsInYear } of postsByYear) {
    markdownContent += `## ${year}\n\n`;

    for (const post of postsInYear) {
      const date = new Date(post.data.pubDatetime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      markdownContent += `- ${date}: [${post.data.title}](${getPostPath(post)})\n`;
    }

    markdownContent += "\n";
  }

  markdownContent += "---\n\n[Back to Home](/index.md)";
  return markdownContent;
}

export function buildArchivesMarkdown(posts: CollectionEntry<"blog">[]) {
  const postsByYear = getPostsByYear(posts);
  let markdownContent = "# Archives\n\n";
  markdownContent += `Total posts: ${postsByYear.reduce((count, group) => count + group.posts.length, 0)}\n\n`;

  markdownContent += "## Posts by Year\n\n";

  for (const { year, posts: postsInYear } of postsByYear) {
    const count = postsInYear.length;
    markdownContent += `- [${year}](/posts.md#${year}) (${count} post${count !== 1 ? "s" : ""})\n`;
  }

  markdownContent += "\n---\n\n[Back to Home](/index.md) | [All Posts](/posts.md)";
  return markdownContent;
}
