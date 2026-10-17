(function () {
  "use strict";

  var root = document.documentElement;
  var nav = document.querySelector(".nav");
  if (!nav) return;

  var menuButton = nav.querySelector(".menu-button");
  var links = Array.prototype.slice.call(nav.querySelectorAll(".nav-link[data-target]"));
  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  var progress = nav.querySelector(".progress");
  var article = document.querySelector("[data-progress]");

  /* ---- Theme toggle (dark by default, choice remembered) ---- */
  function setTheme(theme) {
    if (theme === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    });
  }

  document.querySelectorAll(".theme-toggle").forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(root.dataset.theme === "light" ? "dark" : "light");
    });
  });
  setTheme(root.dataset.theme === "light" ? "light" : "dark");

  /* ---- Show / hide the nav based on scroll direction ---- */
  var lastY = window.scrollY;

  function onDirection() {
    var y = window.scrollY;
    var delta = y - lastY;
    if (nav.classList.contains("is-open") || nav.querySelector(":focus-visible")) {
      nav.classList.remove("is-hidden");
    } else if (y < nav.offsetHeight) {
      nav.classList.remove("is-hidden");
    } else if (delta > 6) {
      nav.classList.add("is-hidden");
    } else if (delta < -6) {
      nav.classList.remove("is-hidden");
    }
    if (Math.abs(delta) > 6 || y < nav.offsetHeight) lastY = y;
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
      var current = a.getAttribute("data-target") === id;
      a.classList.toggle("is-current", current);
      if (current) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---- Reading progress on article pages ---- */
  function onProgress() {
    if (!progress || !article) return;
    var r = article.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.6;
    var done = Math.min(Math.max(-r.top + window.innerHeight * 0.4, 0), total);
    progress.style.transform = "scaleX(" + (total > 0 ? done / total : 0) + ")";
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onDirection();
      onChapter();
      onProgress();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    onChapter();
    onProgress();
    if (menuButton && getComputedStyle(menuButton).display === "none") setOpen(false);
  });
  onChapter();
  onProgress();

  /* ---- Mobile menu ---- */
  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Menu");
    }
    if (open) nav.classList.remove("is-hidden");
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
  }

  links.forEach(function (a) {
    a.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("click", function (e) {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      if (menuButton) menuButton.focus();
    }
  });

  /* ---- Copy buttons ---- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.querySelector("span");
    var original = label ? label.textContent : "";
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || window.location.href;
      function done(msg) {
        if (!label) return;
        label.textContent = msg;
        setTimeout(function () {
          label.textContent = original;
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { done("Copied"); },
          function () { done("Copy failed"); }
        );
      } else {
        done("Copy failed");
      }
    });
  });
})();
