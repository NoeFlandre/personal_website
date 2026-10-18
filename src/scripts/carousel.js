// One slide at a time with previous/next buttons, arrow keys and swipe.
// Slides are [role="group"] elements; buttons carry data-step="-1" or "1";
// an optional [data-current] element shows the position.
export function initCarousel(root) {
  const slides = [...root.querySelectorAll('[role="group"]')];
  const counter = root.querySelector("[data-current]");
  if (slides.length < 2) return;
  let index = 0;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, j) => {
      const on = j === index;
      slide.classList.toggle("is-active", on);
      if (on) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
    if (counter) counter.textContent = String(index + 1).padStart(2, "0");
  };

  root.classList.add("is-carousel");
  for (const button of root.querySelectorAll("[data-step]")) {
    button.addEventListener("click", () => show(index + Number(button.dataset.step)));
  }
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
  });

  let startX = null;
  root.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  root.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  show(0);
}
