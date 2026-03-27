import { getCollection } from "astro:content";
import { calculateReadingTime, getReadingTimeForPost } from "./readingTimeText.ts";

export { calculateReadingTime, getReadingTimeForPost };

export async function getReadingTime(postId: string): Promise<string> {
  const posts = await getCollection("blog");
  const post = posts.find((p) => p.id === postId);
  return getReadingTimeForPost(post);
}
