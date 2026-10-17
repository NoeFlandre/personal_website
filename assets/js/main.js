(function () {
  "use strict";

  var nav = document.querySelector(".nav");
  if (!nav) return;

  var menuButton = nav.querySelector(".menu-button");
  var links = Array.prototype.slice.call(nav.querySelectorAll(".nav-link[data-target]"));
  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));

  /* ---- Show / hide the nav based on scroll direction ---- */
  var lastY = window.scrollY;

  function onDirection() {
    var y = window.scrollY;
    if (nav.classList.contains("is-open")) {
      lastY = y;
      return;
    }
    if (y > lastY && y > 0) {
      nav.classList.add("is-hidden");
    } else if (y < lastY) {
      nav.classList.remove("is-hidden");
    }
    lastY = y;
  }

  /* ---- Nav colour + current link follow the chapter in view ---- */
  function onChapter() {
    if (!chapters.length) return;
    var line = window.innerHeight * 0.2;
    var active = chapters[0];
    chapters.forEach(function (ch) {
      if (ch.getBoundingClientRect().top <= line) active = ch;
    });
    nav.style.setProperty("--nav-bg", "var(--" + active.getAttribute("data-color") + ")");
    var id = active.getAttribute("data-chapter");
    links.forEach(function (a) {
      a.classList.toggle("is-current", a.getAttribute("data-target") === id);
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        onDirection();
        onChapter();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", onChapter);
  onChapter();

  /* ---- Mobile menu ---- */
  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    if (menuButton) menuButton.setAttribute("aria-expanded", String(open));
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
  }

  links.forEach(function (a) {
    a.addEventListener("click", function () {
      if (menuButton && getComputedStyle(menuButton).display !== "none") setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();
