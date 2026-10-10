import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { BLOG_TAGS } from "@/features/blog/contentRules";
import { SITE } from "@/site-config.js";
import { BLOG_PATH } from "./features/blog/contentPaths.ts";

// Same check dayjs .tz() relies on, so a bad zone fails schema validation instead of the build.
function isValidTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.coerce.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().default(false),
      unlisted: z.boolean().default(false),
      tags: z.array(z.enum(BLOG_TAGS)).length(1).default(["Post"]),
      ogImage: image().or(z.string()).optional(),
      heroImage: z.string().optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      // "" is allowed: Datetime.astro falls back to SITE.timezone for an empty value.
      timezone: z
        .string()
        .refine((zone) => zone === "" || isValidTimeZone(zone), {
          message: "Invalid IANA time zone",
        })
        .optional(),
      // Additional fields from existing posts
      readingTime: z.string().optional(),
      layoutStyle: z.string().optional(),
    }),
});

export const collections = { blog };
