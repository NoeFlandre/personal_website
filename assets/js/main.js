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

  /* ---- CV: one group at a time, as tabs ---- */
  var cvList = document.querySelector(".cv-nav ul");
  if (cvList) {
    var cvTabs = Array.prototype.slice.call(cvList.querySelectorAll("a"));
    var cvPanels = cvTabs.map(function (a) {
      return document.getElementById(a.getAttribute("href").slice(1));
    });
    var cvGrid = document.querySelector(".content--cv .content-grid");

    cvList.setAttribute("role", "tablist");
    cvTabs.forEach(function (a, i) {
      a.parentElement.setAttribute("role", "presentation");
      a.setAttribute("role", "tab");
      a.id = "tab-" + cvPanels[i].id;
      a.setAttribute("aria-controls", cvPanels[i].id);
      cvPanels[i].setAttribute("role", "tabpanel");
      cvPanels[i].setAttribute("aria-labelledby", a.id);
    });
    if (cvPanels[0]) cvPanels[0].parentElement.classList.add("cv-tabbed");

    var selectTab = function (i, focus) {
      cvTabs.forEach(function (a, j) {
        var on = i === j;
        a.classList.toggle("is-current", on);
        a.setAttribute("aria-selected", String(on));
        a.tabIndex = on ? 0 : -1;
        cvPanels[j].hidden = !on;
      });
      if (focus) cvTabs[i].focus();
    };

    cvTabs.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        selectTab(i);
        // A shorter panel can leave you below it; bring the CV back into view.
        var top = cvGrid ? cvGrid.getBoundingClientRect().top : 0;
        if (top < 0) window.scrollBy({ top: top - 40, behavior: "smooth" });
      });
      a.addEventListener("keydown", function (e) {
        var next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: cvTabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        selectTab((next + cvTabs.length) % cvTabs.length, true);
      });
    });

    var fromHash = cvPanels.map(function (pnl) { return "#" + pnl.id; }).indexOf(location.hash);
    selectTab(fromHash > 0 ? fromHash : 0);
  }

  /* ---- Recommendations: one quote at a time ---- */
  var recs = document.querySelector(".recs");
  if (recs) {
    var slides = Array.prototype.slice.call(recs.querySelectorAll(".rec"));
    var counter = recs.querySelector("[data-rec-current]");
    var index = 0;
    var show = function (i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (sl, j) {
        var on = j === index;
        sl.classList.toggle("is-active", on);
        if (on) sl.removeAttribute("aria-hidden");
        else sl.setAttribute("aria-hidden", "true");
      });
      if (counter) counter.textContent = String(index + 1).padStart(2, "0");
    };
    recs.classList.add("is-carousel");
    recs.querySelectorAll("[data-rec-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        show(index + Number(b.getAttribute("data-rec-step")));
      });
    });
    recs.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "ArrowLeft") show(index - 1);
    });
    var startX = null;
    var stage = recs.querySelector(".recs-stage");
    stage.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
    show(0);
  }

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
