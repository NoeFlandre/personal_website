import { buildYouTubeEmbedMarkup } from "../../../utils/youtubeEmbeds.js";

function createProgressBar() {
  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container fixed top-0 z-10 h-1 w-full bg-background";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);
}

function updateScrollProgress() {
  document.addEventListener("scroll", () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const myBar = document.getElementById("myBar");

    if (myBar) {
      myBar.style.width = `${scrolled}%`;
    }
  });
}

function addHeadingLinks() {
  const headings = Array.from(document.querySelectorAll("h2, h3, h4, h5, h6"));

  for (const heading of headings) {
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className = "heading-link ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100";
    link.href = `#${heading.id}`;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}

function attachCopyButtons() {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  for (const codeBlock of codeBlocks) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const copyButton = document.createElement("button");
    copyButton.className =
      "copy-code absolute right-3 -top-3 rounded bg-muted px-2 py-1 text-xs leading-4 text-foreground font-medium";
    copyButton.innerHTML = copyButtonLabel;
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);

    codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    copyButton.addEventListener("click", async () => {
      await copyCode(codeBlock, copyButton);
    });
  }

  async function copyCode(block, button) {
    const code = block.querySelector("code");
    const text = code?.innerText;

    await navigator.clipboard.writeText(text ?? "");
    button.innerText = "Copied";

    setTimeout(() => {
      button.innerText = copyButtonLabel;
    }, 700);
  }
}

function backToTop() {
  document.querySelector("#back-to-top")?.addEventListener("click", () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });
}

function addLazyLoading() {
  const article = document.querySelector("#article");
  if (!article) return;

  const images = article.querySelectorAll("img:not([loading])");
  images.forEach((img) => {
    img.setAttribute("loading", "lazy");
  });
}

function setupKeyboardNavigation() {
  const navContainer = document.querySelector("[data-prev-url]");
  if (!navContainer) return;

  const prevUrl = navContainer.getAttribute("data-prev-url");
  const nextUrl = navContainer.getAttribute("data-next-url");

  document.addEventListener("keydown", (e) => {
    if (e.target.matches('input, textarea, [contenteditable="true"]')) return;

    if (e.key === "j" && nextUrl) {
      window.location.href = nextUrl;
    } else if (e.key === "k" && prevUrl) {
      window.location.href = prevUrl;
    }
  });
}

function processEmbeds() {
  const article = document.querySelector("#article");
  if (!article) return;

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

export function initPostDetails() {
  createProgressBar();
  updateScrollProgress();
  addHeadingLinks();
  attachCopyButtons();
  backToTop();
  document.addEventListener("astro:after-swap", () =>
    window.scrollTo({ left: 0, top: 0, behavior: "instant" })
  );
  addLazyLoading();
  setupKeyboardNavigation();
  processEmbeds();
  document.addEventListener("astro:page-load", processEmbeds);
}
