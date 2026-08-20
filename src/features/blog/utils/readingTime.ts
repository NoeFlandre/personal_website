import { getCollection } from "astro:content";
import { calculateReadingTime, getReadingTimeForPost } from "./readingTimeText.ts";

export { calculateReadingTime, getReadingTimeForPost };

export async function getReadingTime(
  postId: string,
  getCollectionFn: typeof getCollection = getCollection
): Promise<string> {
  const posts = await getCollectionFn("blog");
  const post = posts.find((p) => p.id === postId);
  return getReadingTimeForPost(post);
}
