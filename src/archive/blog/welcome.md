---
title: "Welcome to My Blog"
description: "A comprehensive template to get you started with images, code cells, and more."
pubDatetime: 2025-01-27T12:00:00+01:00
modDatetime: 2025-01-27T12:00:00+01:00
heroImage: /noe-about.png
tags: ["welcome", "template", "guide"]
featured: true
---

Welcome to your new blog! This post serves as both a welcome message and a **Master Template** to help you understand how to use all the features of this website.

## 🖼️ Hero Images

You can add a hero image to any post by adding the `heroImage` field to the frontmatter. The image will be displayed at the top of the post and used for social sharing.

```yaml
heroImage: "/assets/img/your-image.jpg"
```

## 💻 Code Blocks

The blog supports syntax highlighting for many languages. Here is an example of a TypeScript code block:

```typescript
interface BlogPost {
  title: string;
  pubDatetime: Date;
  description: string;
  heroImage?: string;
}

const welcomePost: BlogPost = {
  title: "Welcome to My Blog",
  pubDatetime: new Date("2025-01-27"),
  description: "A comprehensive template to get you started."
};
```

## 🐦 Social Embeds

You can easily embed Twitter/X posts and YouTube videos using simple shortcodes in your markdown content.

### Twitter Embed
{% twitter https://x.com/OpenAI/status/1722058479122192550 %}

### YouTube Embed
{% youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ %}

## 📝 Markdown Features

All standard markdown features are supported:
- **Bold text** and *italic text*
- [Hyperlinks](https://google.com)
- Unordered and ordered lists
- Blockquotes
- Tables

> "The best way to predict the future is to invent it." — Alan Kay

## 🚀 Getting Started

To create a new post, simply add a new `.md` file to `src/content/blog/`. You can use this file as a reference for the frontmatter structure.

Happy writing!
