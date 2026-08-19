import { slugifyStr } from "../../../utils/slugify.ts";
import { BLOG_PATH } from "../contentPaths.ts";

function normalizePostSlug(slug: string) {
  return slug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function getPathSegments(filePath: string | undefined) {
  return filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter((path) => path !== "")
    .filter((path) => !path.startsWith("_"))
    .slice(0, -1)
    .map((segment) => slugifyStr(segment));
}

function getPostSlug(id: string) {
  return normalizePostSlug(id.split("/").slice(-1)[0] ?? "");
}

/**
 * Get full path of a blog post
 * @param id - id of the blog post (aka slug)
 * @param filePath - the blog post full file location
 * @param includeBase - whether to include `/posts` in return value
 * @returns blog post path
 */
export function getPath(id: string, filePath: string | undefined, includeBase = true) {
  const pathSegments = getPathSegments(filePath) ?? [];
  const basePath = includeBase ? "/posts" : "";
  const slug = getPostSlug(id);
  return [basePath, ...pathSegments, slug].join("/");
}
