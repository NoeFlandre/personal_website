import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import getSortedPosts from "@/features/blog/utils/getSortedPosts";
import { getPostPath } from "@/features/blog/utils/postPath";
import { SITE } from "@/site-config.js";

export async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: getPostPath({ id, filePath }),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
