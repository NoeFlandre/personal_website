import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import getSortedPosts from "@/features/blog/utils/getSortedPosts";
import { getLegacyFeedGuid } from "@/features/blog/utils/legacyPostPaths";
import { getPostPath } from "@/features/blog/utils/postPath";
import { SITE } from "@/site-config.js";

export async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map(({ data, id, filePath }) => {
      const link = getPostPath({ id, filePath });
      const legacyGuid = getLegacyFeedGuid(link);
      return {
        link,
        title: data.title,
        description: data.description,
        pubDate: new Date(data.modDatetime ?? data.pubDatetime),
        // The library sets the guid from the link. Moved posts keep their old guid.
        customData: legacyGuid ? `<guid isPermaLink="true">${legacyGuid}</guid>` : undefined,
      };
    }),
  });
}
