// Buttons with data-copy="text" copy that text and say so for a moment.
export function initCopyButtons(root) {
  for (const button of root.querySelectorAll("[data-copy]")) {
    const label = button.querySelector("span");
    const idle = label?.textContent ?? "";
    let timer = 0;
    const flash = (message) => {
      if (!label) return;
      label.textContent = message;
      clearTimeout(timer);
      timer = setTimeout(() => (label.textContent = idle), 1600);
    };
    button.addEventListener("click", () => {
      const text = button.dataset.copy || location.href;
      if (!navigator.clipboard?.writeText) return flash("Copy failed");
      navigator.clipboard.writeText(text).then(() => flash("Copied"), () => flash("Copy failed"));
    });
  }
}
