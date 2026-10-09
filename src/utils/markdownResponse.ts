const MARKDOWN_MAX_AGE_SECONDS = 3600;

export function markdownResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": `public, max-age=${MARKDOWN_MAX_AGE_SECONDS}`,
    },
  });
}
