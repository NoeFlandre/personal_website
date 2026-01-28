import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const markdownContent = `# Noé Flandre (@NoeFlandre)

AI Research Engineer, vibe-learning
Daily meal : curating datasets & training models

## Navigation

- [About](/about.md)
- [Recent Posts](/posts.md)
- [Archives](/archives.md)
- [RSS Feed](/rss.xml)

## Links

- Twitter: [@NoeFlandre](https://x.com/NoeFlandre)
- GitHub: [@NoeFlandre](https://github.com/NoeFlandre)
- Email: noe.flandre@gmail.com

---

*This is the markdown-only version of noeflandre.github.io. Visit [noeflandre.github.io](https://noeflandre.github.io) for the full experience.*`;

  return new Response(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
