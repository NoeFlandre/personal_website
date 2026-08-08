# Using YouTube Embeds in Blog Posts

This document provides a quick guide on how to use YouTube embeds in blog posts.

## Using the YouTube Embed Tag

To embed a YouTube video, use the following syntax:

```
{% youtube VIDEO_ID %}
```

Where `VIDEO_ID` is either the YouTube video ID or the full URL to the video.

### Examples

Using just the video ID:

```
{% youtube dQw4w9WgXcQ %}
```

Using the full YouTube URL:

```
{% youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ %}
```

Using a youtu.be short URL:

```
{% youtube https://youtu.be/dQw4w9WgXcQ %}
```

## How It Works

On blog post pages, the `postDetailsRerun.js` client module scans the article for these patterns and replaces them with responsive YouTube iframes. It runs after the initial page load and after Astro view transitions.

## Best Practices

1. Always use the `{% youtube VIDEO_ID %}` syntax instead of writing iframe markup directly
2. The embed is responsive and adjusts to different screen sizes
3. Use a full YouTube URL, a youtu.be short URL, an embed URL, or the video ID itself
