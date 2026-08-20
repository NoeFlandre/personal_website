import { SITE } from "../site-config.js";
import { toAbsoluteUrl } from "./url.ts";

export type BlogPostingData = {
  title: string;
  description: string;
  author?: string;
  pubDatetime: Date;
  modDatetime?: Date | null;
  url: string;
  ogImage?: string;
  tags?: string[];
  wordCount?: number;
  readingTime?: string;
};

export type StructuredData = Record<string, unknown>;

const defaultImage = toAbsoluteUrl(SITE.ogImage, SITE.website);

function addOptionalBlogFields(structuredData: StructuredData, data: BlogPostingData) {
  if (data.tags?.length) {
    structuredData.articleSection = data.tags[0];
    structuredData.keywords = data.tags.join(", ");
  }
  if (data.wordCount !== undefined) {
    structuredData.wordCount = data.wordCount;
  }
  if (data.readingTime) {
    structuredData.timeRequired = data.readingTime;
  }
}

function buildBlogPostingStructuredData(data?: BlogPostingData): StructuredData {
  if (!data) {
    throw new Error("BlogPosting structured data requires post data");
  }

  const datePublished = data.pubDatetime.toISOString();
  const structuredData: StructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.description,
    author: {
      "@type": "Person",
      name: data.author ?? SITE.author,
      url: SITE.profile,
    },
    datePublished,
    dateModified: data.modDatetime?.toISOString() ?? datePublished,
    publisher: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.profile,
      logo: {
        "@type": "ImageObject",
        url: defaultImage,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toAbsoluteUrl(data.url, SITE.website),
    },
    image: data.ogImage ? toAbsoluteUrl(data.ogImage, SITE.website) : defaultImage,
  };

  addOptionalBlogFields(structuredData, data);

  return structuredData;
}

function buildPersonStructuredData(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.author,
    url: SITE.profile,
    image: defaultImage,
    sameAs: [
      "https://github.com/NoeFlandre",
      "https://x.com/NoeFlandre",
      "https://huggingface.co/NoeFlandre",
      "https://orcid.org/0009-0002-0237-3727",
    ],
    jobTitle: "AI Research Engineer, vibe-learning",
    description: SITE.desc,
  };
}

function buildWebsiteStructuredData(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    url: SITE.website,
    description: SITE.desc,
    author: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.profile,
    },
  };
}

export function buildStructuredData(type: "BlogPosting", data: BlogPostingData): StructuredData;
export function buildStructuredData(type: "Person" | "WebSite"): StructuredData;
export function buildStructuredData(
  type: "BlogPosting" | "Person" | "WebSite",
  data?: BlogPostingData
): StructuredData {
  if (type === "BlogPosting") {
    return buildBlogPostingStructuredData(data);
  }

  if (type === "Person") {
    return buildPersonStructuredData();
  }

  return buildWebsiteStructuredData();
}

export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
