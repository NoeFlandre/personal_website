const LEGACY_BLOG_INDEX_PATHS = new Set(["/blog"]);

export const onRequest = async (context, next) => {
  const url = new URL(context.request.url);

  // Redirect /blog/ paths to /posts/
  if (url.pathname.startsWith("/blog/")) {
    return context.redirect("/posts/" + url.pathname.slice(6), 301);
  }

  // Redirect /blog to /posts
  if (LEGACY_BLOG_INDEX_PATHS.has(url.pathname)) {
    return context.redirect("/posts/", 301);
  }

  return next();
};
