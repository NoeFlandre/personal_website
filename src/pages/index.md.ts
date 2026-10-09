import type { APIRoute } from "astro";
import { SITE, SOCIALS } from "@/site-config.js";
import { markdownResponse } from "../utils/markdownResponse.ts";

export const GET: APIRoute = async () => {
  const navigation = [
    "- [About](/about.md)",
    "- [Recent Posts](/posts.md)",
    ...(SITE.showArchives ? ["- [Archives](/archives.md)"] : []),
    "- [RSS Feed](/rss.xml)",
  ].join("\n");
  const links = SOCIALS.filter((social) => social.active)
    .map((social) => `- [${social.name}](${social.href})`)
    .join("\n");

  const markdownContent = `# ${SITE.title}

${SITE.desc}

## Navigation

${navigation}

## Links

${links}

---

*This is the markdown-only version of ${SITE.website}. Visit [${SITE.website}](${SITE.website}) for the full experience.*`;

  return markdownResponse(markdownContent);
};
