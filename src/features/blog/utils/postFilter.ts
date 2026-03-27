import type { CollectionEntry } from "astro:content";
import { SITE } from "../../../site-config.js";

interface VisibilityOptions {
  now?: number;
  isDev?: boolean;
}

type BlogPostData = CollectionEntry<"blog">["data"];

export function isDraftFreePost(data: Pick<BlogPostData, "draft">) {
  return !data.draft;
}

export function isListedPost(data: Pick<BlogPostData, "draft" | "unlisted">) {
  return isDraftFreePost(data) && !data.unlisted;
}

export function isUnlistedPost(data: Pick<BlogPostData, "draft" | "unlisted">) {
  return isDraftFreePost(data) && !!data.unlisted;
}

export function isPostVisible(
  data: BlogPostData,
  { now = Date.now(), isDev = import.meta.env?.DEV ?? false }: VisibilityOptions = {}
) {
  const isPublishTimePassed = now > new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;

  return isListedPost(data) && (isDev || isPublishTimePassed);
}

const postFilter = ({ data }: CollectionEntry<"blog">) => {
  return isPostVisible(data);
};

export default postFilter;
