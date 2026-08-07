export const BLOG_TAGS = ["Publication", "Paper Review", "Project", "Post"] as const;

export type BlogTag = (typeof BLOG_TAGS)[number];
