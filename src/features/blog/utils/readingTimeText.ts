import readingTime from "reading-time";

export function calculateReadingTime(content: string): string {
  const stats = readingTime(content);
  const minutes = Math.ceil(stats.minutes);
  return `${minutes} min read`;
}

export function getReadingTimeForPost(post: { body?: string } | undefined): string {
  if (!post?.body) {
    return "5 min read";
  }

  return calculateReadingTime(post.body);
}
