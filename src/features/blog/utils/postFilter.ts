import type { CollectionEntry } from "astro:content";
import { SITE } from "../../../site-config.js";

interface VisibilityOptions {
  now?: number;
  isDev?: boolean;
}

export function isPostVisible(
  data: CollectionEntry<"blog">["data"],
  { now = Date.now(), isDev = import.meta.env?.DEV ?? false }: VisibilityOptions = {}
) {
  const isPublishTimePassed = now > new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;

  return !data.draft && !data.unlisted && (isDev || isPublishTimePassed);
}

const postFilter = ({ data }: CollectionEntry<"blog">) => {
  return isPostVisible(data);
};

export default postFilter;
