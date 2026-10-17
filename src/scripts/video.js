// Video links (a.video[data-video]) become the YouTube player on click, so a
// post loads no YouTube code until the reader asks for the video.
export function initVideos(root) {
  root.addEventListener("click", (event) => {
    const link = event.target.closest?.("a.video[data-video]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const params = new URLSearchParams({ autoplay: "1", rel: "0" });
    if (link.dataset.start) params.set("start", link.dataset.start);
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?${params}`;
    frame.title = "YouTube video player";
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    frame.allowFullscreen = true;
    frame.className = "video";
    link.replaceWith(frame);
    frame.focus();
  });
}
