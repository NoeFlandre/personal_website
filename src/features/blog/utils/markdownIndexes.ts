import type { CollectionEntry } from "astro:content";
import { getPath } from "./getPath.ts";
import getSortedPosts from "./getSortedPosts.ts";

export function buildPostsMarkdown(posts: CollectionEntry<"blog">[]) {
  const sortedPosts = getSortedPosts(posts);
  let markdownContent = "# All Posts\n\n";

  const postsByYear = sortedPosts.reduce(
    (acc, post) => {
      const year = new Date(post.data.pubDatetime).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(post);
      return acc;
    },
    {} as Record<number, typeof sortedPosts>
  );

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  for (const year of years) {
    markdownContent += `## ${year}\n\n`;

    for (const post of postsByYear[Number(year)]) {
      const date = new Date(post.data.pubDatetime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      markdownContent += `- ${date}: [${post.data.title}](${getPath(post.id, post.filePath)})\n`;
    }

    markdownContent += "\n";
  }

  markdownContent += "---\n\n[Back to Home](/index.md)";
  return markdownContent;
}

export function buildArchivesMarkdown(posts: CollectionEntry<"blog">[]) {
  const sortedPosts = getSortedPosts(posts);
  let markdownContent = "# Archives\n\n";
  markdownContent += `Total posts: ${sortedPosts.length}\n\n`;

  const postsByYear = sortedPosts.reduce(
    (acc, post) => {
      const year = new Date(post.data.pubDatetime).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(post);
      return acc;
    },
    {} as Record<number, typeof sortedPosts>
  );

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  markdownContent += "## Posts by Year\n\n";

  for (const year of years) {
    const count = postsByYear[Number(year)].length;
    markdownContent += `- [${year}](/posts.md#${year}) (${count} post${count !== 1 ? "s" : ""})\n`;
  }

  markdownContent += "\n---\n\n[Back to Home](/index.md) | [All Posts](/posts.md)";
  return markdownContent;
}
