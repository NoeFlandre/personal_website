const YOUTUBE_EMBED_CLASS = "youtube-embed-container";

export function extractYouTubeId(input) {
  if (typeof input !== "string") return "";

  const trimmedInput = input.trim();
  if (!trimmedInput) return "";

  try {
    if (trimmedInput.includes("youtube.com/watch")) {
      const url = new URL(trimmedInput);
      return url.searchParams.get("v") || "";
    }

    if (trimmedInput.includes("youtu.be/")) {
      return trimmedInput.split("youtu.be/")[1]?.split("?")[0] || "";
    }

    if (trimmedInput.includes("youtube.com/embed/")) {
      return trimmedInput.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }
  } catch (_) {
    return trimmedInput;
  }

  return trimmedInput;
}

export function getYouTubeEmbedSrc(input) {
  return `https://www.youtube.com/embed/${extractYouTubeId(input)}`;
}

export function buildYouTubeEmbedMarkup(input) {
  return `<div class="${YOUTUBE_EMBED_CLASS}">
    <iframe
      width="560"
      height="315"
      src="${getYouTubeEmbedSrc(input)}"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>`;
}
