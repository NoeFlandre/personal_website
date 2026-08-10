import { createClientLifecycle } from "../../../utils/clientLifecycle.js";
import { buildYouTubeEmbedMarkup } from "../../../utils/youtubeEmbeds.js";

const lifecycle = createClientLifecycle();
let transitionHooksBound = false;

function createProgressBar(signal) {
  if (document.querySelector(".progress-container[data-post-progress]")) return;

  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container fixed top-0 z-10 h-1 w-full bg-background";
  progressContainer.dataset.postProgress = "true";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);

  signal.addEventListener("abort", () => progressContainer.remove(), { once: true });
}

function updateScrollProgress(signal) {
  const update = () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? Math.min(100, Math.max(0, (winScroll / height) * 100)) : 0;
    const myBar = document.getElementById("myBar");

    if (myBar) {
      myBar.style.width = `${scrolled}%`;
    }
  };

  document.addEventListener("scroll", update, { signal });
  update();
}

function addHeadingLinks(article, signal) {
  const headings = Array.from(article.querySelectorAll("h2, h3, h4, h5, h6"));
  const links = [];

  for (const heading of headings) {
    if (!heading.id || heading.querySelector(":scope > .heading-link")) continue;

    heading.classList.add("group");
    const link = document.createElement("a");
    link.className = "heading-link ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100";
    link.href = `#${heading.id}`;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
    links.push(link);
  }

  signal.addEventListener(
    "abort",
    () => {
      links.forEach((link) => {
        link.remove();
      });
    },
    { once: true }
  );
}

function attachCopyButtons(article, signal) {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(article.querySelectorAll("pre"));
  const wrappers = [];

  for (const codeBlock of codeBlocks) {
    if (codeBlock.querySelector(":scope > .copy-code")) continue;

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const copyButton = document.createElement("button");
    copyButton.className =
      "copy-code absolute right-3 -top-3 rounded bg-muted px-2 py-1 text-xs leading-4 text-foreground font-medium";
    copyButton.textContent = copyButtonLabel;
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);

    codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);
    wrappers.push({ codeBlock, copyButton, wrapper });

    copyButton.addEventListener(
      "click",
      async () => {
        await copyCode(codeBlock, copyButton);
      },
      { signal }
    );
  }

  signal.addEventListener(
    "abort",
    () => {
      wrappers.forEach(({ codeBlock, copyButton, wrapper }) => {
        if (wrapper.parentNode) wrapper.replaceWith(codeBlock);
        copyButton.remove();
        codeBlock.removeAttribute("tabindex");
      });
    },
    { once: true }
  );

  async function copyCode(block, button) {
    const code = block.querySelector("code");
    const text = code?.innerText;

    await navigator.clipboard.writeText(text ?? "");
    if (signal.aborted) return;
    button.innerText = "Copied";

    const timeoutId = setTimeout(() => {
      button.innerText = copyButtonLabel;
    }, 700);
    signal.addEventListener("abort", () => clearTimeout(timeoutId), { once: true });
  }
}

function backToTop(signal) {
  document.querySelector("#back-to-top")?.addEventListener(
    "click",
    () => {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    },
    { signal }
  );
}

function addLazyLoading(article) {
  const images = article.querySelectorAll("img:not([loading])");
  images.forEach((img) => {
    img.setAttribute("loading", "lazy");
  });
}

function setupKeyboardNavigation(signal) {
  const navContainer = document.querySelector("[data-prev-url]");
  if (!navContainer) return;

  const prevUrl = navContainer.getAttribute("data-prev-url");
  const nextUrl = navContainer.getAttribute("data-next-url");

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.target.matches('input, textarea, [contenteditable="true"]')) return;

      if (e.key === "j" && nextUrl) {
        window.location.href = nextUrl;
      } else if (e.key === "k" && prevUrl) {
        window.location.href = prevUrl;
      }
    },
    { signal }
  );
}

function processEmbeds(article) {
  const youtubeEmbedRegex = /\{% youtube (https:\/\/[^\s]+|[a-zA-Z0-9_-]+) %\}/g;

  const pNodes = article.querySelectorAll("p");
  pNodes.forEach((p) => {
    const text = (p.textContent || "").trim();
    const ytMatch = text.match(/\{% youtube (https:\/\/[^\s]+|[a-zA-Z0-9_-]+) %\}/);

    if (ytMatch?.[1]) {
      const container = document.createElement("div");
      container.innerHTML = buildYouTubeEmbedMarkup(ytMatch[1]);
      const embed = container.firstElementChild;
      if (embed) {
        p.replaceWith(embed);
      }
    }
  });

  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    let content = textNode.textContent;
    let hasChanges = false;

    content = content.replace(youtubeEmbedRegex, (_match, videoId) => {
      hasChanges = true;
      return buildYouTubeEmbedMarkup(videoId);
    });

    if (hasChanges) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      const parent = textNode.parentNode;
      while (tempDiv.firstChild) {
        parent.insertBefore(tempDiv.firstChild, textNode);
      }
      parent.removeChild(textNode);
    }
  });
}

function ensureTransitionHooks() {
  if (transitionHooksBound) return;

  document.addEventListener("astro:before-swap", () => lifecycle.cleanup());
  document.addEventListener("astro:after-swap", () =>
    window.scrollTo({ left: 0, top: 0, behavior: "instant" })
  );
  transitionHooksBound = true;
}

export function initPostDetails() {
  const article = document.querySelector("#article");
  if (!article) {
    lifecycle.cleanup();
    return;
  }

  ensureTransitionHooks();
  lifecycle.activate(article, (signal) => {
    createProgressBar(signal);
    updateScrollProgress(signal);
    addHeadingLinks(article, signal);
    attachCopyButtons(article, signal);
    backToTop(signal);
    addLazyLoading(article);
    setupKeyboardNavigation(signal);
    processEmbeds(article);
  });
}
