(function () {
  "use strict";

  var root = document.documentElement;

  /* ---- Fresh page loads start at the top ----
     Some embedded viewers carry the previous page's scroll position over,
     which drops you at the bottom of a shorter page. Only for plain link
     navigations without a #section: back/forward keeps its position. */
  var navEntry = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  if (!location.hash && (!navEntry || navEntry.type === "navigate")) {
    var toTop = function () {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    toTop();
    document.addEventListener("DOMContentLoaded", toTop);
    window.addEventListener("load", function () {
      toTop();
      window.requestAnimationFrame(toTop);
    });
  }

  var nav = document.querySelector(".nav");
  if (!nav) return;

  var menuButton = nav.querySelector(".menu-button");
  var links = Array.prototype.slice.call(nav.querySelectorAll(".nav-link[data-target]"));
  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  var progress = nav.querySelector(".progress");
  var article = document.querySelector("[data-progress]");

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

  /* ---- CV jump menu follows the group in view ---- */
  var cvLinks = Array.prototype.slice.call(document.querySelectorAll(".cv-nav ul a"));
  if (cvLinks.length && "IntersectionObserver" in window) {
    var cvSeen = {};
    var cvObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          cvSeen[en.target.id] = en.isIntersecting;
        });
        var current = null;
        cvLinks.forEach(function (a) {
          if (!current && cvSeen[a.getAttribute("href").slice(1)]) current = a;
        });
        cvLinks.forEach(function (a) {
          a.classList.toggle("is-current", a === current);
        });
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    cvLinks.forEach(function (a) {
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if (target) cvObserver.observe(target);
    });
  }

  /* ---- Recommendations: "Read more" only on clamped quotes ---- */
  document.querySelectorAll(".quotes .quote").forEach(function (fig) {
    var quote = fig.querySelector("blockquote");
    if (!quote) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quote-more";
    btn.textContent = "Read more";
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var open = fig.classList.toggle("is-open");
      btn.textContent = open ? "Show less" : "Read more";
      btn.setAttribute("aria-expanded", String(open));
    });
    quote.insertAdjacentElement("afterend", btn);
    function sync() {
      if (fig.classList.contains("is-open")) return;
      btn.hidden = quote.scrollHeight <= quote.clientHeight + 2;
    }
    sync();
    window.addEventListener("resize", sync);
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
