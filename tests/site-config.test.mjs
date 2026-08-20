import assert from "node:assert/strict";
import test from "node:test";

import {
  NAV_LINKS,
  SHARE_LINKS,
  SITE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SOCIALS,
} from "../src/site-config.js";

test("site-config exposes the site title and description aliases", () => {
  assert.equal(SITE_TITLE, SITE.title);
  assert.equal(SITE_DESCRIPTION, SITE.desc);
});

test("site-config exposes expected social and share link collections", () => {
  assert.ok(SOCIALS.length > 0);
  assert.ok(SHARE_LINKS.length > 0);
  assert.ok(SOCIALS.every((entry) => typeof entry.href === "string" && entry.href.length > 0));
});

test("site-config preserves navigation, social, and share contracts", () => {
  const expected = {
    SITE: {
      website: "https://noeflandre.com/",
      author: "Noé Flandre",
      profile: "https://noeflandre.com/about",
      desc: "AI Research Engineer, vibe-learning. Daily meal : curating datasets & training models",
      title: "Noé Flandre",
      ogImage: "noe-avatar.jpg",
      lightAndDarkMode: true,
      postPerIndex: 10,
      postPerPage: 10,
      scheduledPostMargin: 900000,
      showArchives: false,
      showBackButton: false,
      editPost: {
        enabled: true,
        text: "Edit on GitHub",
        url: "https://github.com/NoeFlandre/personal_website/edit/main/",
      },
      dynamicOgImage: true,
      lang: "en",
      timezone: "America/Los_Angeles",
    },
    NAV_LINKS: [
      { href: "/", label: "Blog" },
      { href: "/about", label: "About" },
    ],
    SOCIALS: [
      {
        name: "HuggingFace",
        href: "https://huggingface.co/NoeFlandre",
        linkTitle: "Noé Flandre on HuggingFace",
        icon: "huggingface",
        active: true,
      },
      {
        name: "Github",
        href: "https://github.com/NoeFlandre",
        linkTitle: "Noé Flandre on Github",
        icon: "github",
        active: true,
      },
      {
        name: "Google Scholar",
        href: "https://scholar.google.com/citations?user=NOvshPMAAAAJ&hl=en",
        linkTitle: "Noé Flandre on Google Scholar",
        icon: "googlescholar",
        active: true,
      },
      {
        name: "ORCID",
        href: "https://orcid.org/0009-0002-0237-3727",
        linkTitle: "Noé Flandre on ORCID",
        icon: "orcid",
        active: true,
      },
      {
        name: "X",
        href: "https://x.com/NoeFlandre",
        linkTitle: "Noé Flandre on X",
        icon: "twitter",
        active: true,
      },
      {
        name: "LinkedIn",
        href: "https://www.linkedin.com/in/no%C3%A9flandre/",
        linkTitle: "Noé Flandre on LinkedIn",
        icon: "linkedin",
        active: true,
      },
      {
        name: "YouTube",
        href: "https://www.youtube.com/@NoeFlandre",
        linkTitle: "Noé Flandre on YouTube",
        icon: "youtube",
        active: true,
      },
      {
        name: "Email",
        href: "mailto:noeflandre@gmail.com",
        linkTitle: "Email Noé Flandre",
        icon: "mail",
        active: true,
      },
      {
        name: "CV",
        href: "/assets/docs/noe-flandre-cv.pdf",
        linkTitle: "View Noé Flandre CV (PDF)",
        icon: "cv",
        active: true,
      },
    ],
    SHARE_LINKS: [
      {
        name: "X",
        href: "https://x.com/intent/post?url=",
        linkTitle: "Share this post on X",
        icon: "twitter",
      },
      {
        name: "BlueSky",
        href: "https://bsky.app/intent/compose?text=",
        linkTitle: "Share this post on BlueSky",
        icon: "bluesky",
      },
      {
        name: "LinkedIn",
        href: "https://www.linkedin.com/sharing/share-offsite/?url=",
        linkTitle: "Share this post on LinkedIn",
        icon: "linkedin",
      },
      {
        name: "WhatsApp",
        href: "https://wa.me/?text=",
        linkTitle: "Share this post via WhatsApp",
        icon: "whatsapp",
      },
      {
        name: "Facebook",
        href: "https://www.facebook.com/sharer.php?u=",
        linkTitle: "Share this post on Facebook",
        icon: "facebook",
      },
      {
        name: "Telegram",
        href: "https://t.me/share/url?url=",
        linkTitle: "Share this post via Telegram",
        icon: "telegram",
      },
      {
        name: "Pinterest",
        href: "https://pinterest.com/pin/create/button/?url=",
        linkTitle: "Share this post on Pinterest",
        icon: "pinterest",
      },
      {
        name: "Mail",
        href: "mailto:?subject=See%20this%20post&body=",
        linkTitle: "Share this post via email",
        icon: "mail",
      },
    ],
  };
  assert.deepEqual({ SITE, NAV_LINKS, SOCIALS, SHARE_LINKS }, expected);
});
