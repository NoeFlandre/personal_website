import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { BLOG_TAGS } from "@/features/blog/contentRules";
import { SITE } from "@/site-config.js";
import { BLOG_PATH } from "./features/blog/contentPaths.ts";

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
      timezone: z.string().optional(),
      // Additional fields from existing posts
      source: z.string().optional(),
      AIDescription: z.boolean().optional(),
      readingTime: z.string().optional(),
      layoutStyle: z.string().optional(),
    }),
});

export const collections = { blog };
