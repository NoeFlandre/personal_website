import { buildYouTubeEmbedMarkup } from "../../../utils/youtubeEmbeds.js";

function createProgressBar(documentRef, signal) {
  if (documentRef.querySelector(".progress-container[data-post-progress]")) return;

  const progressContainer = documentRef.createElement("div");
  progressContainer.className = "progress-container fixed top-0 z-10 h-1 w-full bg-background";
  progressContainer.dataset.postProgress = "true";

  const progressBar = documentRef.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  progressContainer.appendChild(progressBar);
  documentRef.body.appendChild(progressContainer);

  signal.addEventListener("abort", () => progressContainer.remove());
}

function updateScrollProgress(documentRef, signal) {
  const update = () => {
    const winScroll = documentRef.body.scrollTop || documentRef.documentElement.scrollTop;
    const height =
      documentRef.documentElement.scrollHeight - documentRef.documentElement.clientHeight;
    const scrolled = height > 0 ? Math.min(100, Math.max(0, (winScroll / height) * 100)) : 0;
    const progressBar = documentRef.getElementById("myBar");

    if (progressBar) {
      progressBar.style.width = `${scrolled}%`;
    }
  };

  documentRef.addEventListener("scroll", update, { signal });
  update();
}

function addHeadingLinks(article, signal, documentRef) {
  const headings = Array.from(article.querySelectorAll("h2, h3, h4, h5, h6"));
  const links = [];

  for (const heading of headings) {
    if (!heading.id || heading.querySelector(":scope > .heading-link")) continue;

    heading.classList.add("group");
    const link = documentRef.createElement("a");
    link.className = "heading-link ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100";
    link.href = `#${heading.id}`;

    const span = documentRef.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
    links.push(link);
  }

  signal.addEventListener("abort", () => {
    links.forEach((link) => {
      link.remove();
    });
  });
}

function attachCopyButtons(
  article,
  signal,
  documentRef,
  navigatorRef,
  setTimeoutFn,
  clearTimeoutFn
) {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(article.querySelectorAll("pre"));
  const wrappers = [];

  for (const codeBlock of codeBlocks) {
    if (codeBlock.querySelector(":scope > .copy-code")) continue;

    const wrapper = documentRef.createElement("div");
    wrapper.style.position = "relative";

    const copyButton = documentRef.createElement("button");
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

  signal.addEventListener("abort", () => {
    wrappers.forEach(({ codeBlock, copyButton, wrapper }) => {
      if (wrapper.parentNode) wrapper.replaceWith(codeBlock);
      copyButton.remove();
      codeBlock.removeAttribute("tabindex");
    });
  });

  async function copyCode(block, button) {
    const code = block.querySelector("code");
    const text = code?.innerText;

    await navigatorRef.clipboard.writeText(text ?? "");
    if (signal.aborted) return;
    button.innerText = "Copied";

    const timeoutId = setTimeoutFn(() => {
      button.innerText = copyButtonLabel;
    }, 700);
    signal.addEventListener("abort", () => clearTimeoutFn(timeoutId));
  }
}

function backToTop(documentRef, signal) {
  documentRef.querySelector("#back-to-top")?.addEventListener(
    "click",
    () => {
      documentRef.body.scrollTop = 0;
      documentRef.documentElement.scrollTop = 0;
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

function getKeyboardNavigationUrl(event, previousUrl, nextUrl) {
  if (event.target.matches('input, textarea, [contenteditable="true"]')) return null;
  return { j: nextUrl, k: previousUrl }[event.key] ?? null;
}

function navigateWithKeyboard(windowRef, event, previousUrl, nextUrl) {
  const destination = getKeyboardNavigationUrl(event, previousUrl, nextUrl);
  if (destination) windowRef.location.href = destination;
}

function setupKeyboardNavigation(documentRef, windowRef, signal) {
  const navContainer = documentRef.querySelector("[data-prev-url]");
  if (!navContainer) return;

  const prevUrl = navContainer.getAttribute("data-prev-url");
  const nextUrl = navContainer.getAttribute("data-next-url");

  documentRef.addEventListener(
    "keydown",
    (event) => navigateWithKeyboard(windowRef, event, prevUrl, nextUrl),
    { signal }
  );
}

function processEmbeds(article, documentRef, nodeFilterRef) {
  const youtubeEmbedRegex = /\{% youtube (https:\/\/[^\s]+|[a-zA-Z0-9_-]+) %\}/g;

  const pNodes = article.querySelectorAll("p");
  pNodes.forEach((p) => {
    const text = p.textContent;
    const ytMatch = text.match(/\{% youtube (https:\/\/[^\s]+|[a-zA-Z0-9_-]+) %\}/);

    if (!ytMatch) return;

    const container = documentRef.createElement("div");
    container.innerHTML = buildYouTubeEmbedMarkup(ytMatch[1]);
    p.replaceWith(container.firstElementChild);
  });

  const walker = documentRef.createTreeWalker(article, nodeFilterRef?.SHOW_TEXT, null);
  const textNodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach((textNode) => {
    let content = textNode.textContent;
    let hasChanges = false;

    content = content.replace(youtubeEmbedRegex, (_match, videoId) => {
      hasChanges = true;
      return buildYouTubeEmbedMarkup(videoId);
    });

    if (hasChanges) {
      const tempDiv = documentRef.createElement("div");
      tempDiv.innerHTML = content;

      const parent = textNode.parentNode;
      Array.from(tempDiv.childNodes).forEach((child) => {
        parent.insertBefore(child, textNode);
      });
      parent.removeChild(textNode);
    }
  });
}

export function createPostDetailsSession({
  clearTimeoutFn = globalThis.clearTimeout,
  documentRef = globalThis.document,
  navigatorRef = globalThis.navigator,
  nodeFilterRef = globalThis.NodeFilter,
  setTimeoutFn = globalThis.setTimeout,
  windowRef = globalThis.window,
} = {}) {
  return {
    mount(article, signal) {
      if (!article || !signal || !documentRef) return false;

      createProgressBar(documentRef, signal);
      updateScrollProgress(documentRef, signal);
      addHeadingLinks(article, signal, documentRef);
      attachCopyButtons(article, signal, documentRef, navigatorRef, setTimeoutFn, clearTimeoutFn);
      backToTop(documentRef, signal);
      addLazyLoading(article);
      setupKeyboardNavigation(documentRef, windowRef, signal);
      processEmbeds(article, documentRef, nodeFilterRef);

      return true;
    },
  };
}
