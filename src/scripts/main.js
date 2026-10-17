import { resetScrollOnFreshLoad } from "./scroll-reset.js";
import { initNav } from "./nav.js";
import { initTabs } from "./tabs.js";
import { initCarousel } from "./carousel.js";
import { initCopyButtons } from "./copy-button.js";
import { initPrefetch } from "./prefetch.js";
import { initVideos } from "./video.js";

resetScrollOnFreshLoad();

const nav = document.querySelector(".nav");
if (nav) initNav(nav);

document.querySelectorAll("[data-tabs]").forEach(initTabs);
document.querySelectorAll("[data-carousel]").forEach(initCarousel);
initCopyButtons(document);
initVideos(document);
initPrefetch();
