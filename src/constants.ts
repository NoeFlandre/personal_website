import { SITE } from "./consts";

export const SOCIALS = [
  {
    name: "HuggingFace",
    href: "https://huggingface.co/NoeFlandre",
    linkTitle: `${SITE.title} on HuggingFace`,
    icon: "huggingface",
    active: true,
  },
  {
    name: "Github",
    href: "https://github.com/NoeFlandre",
    linkTitle: `${SITE.title} on Github`,
    icon: "github",
    active: true,
  },
  {
    name: "Google Scholar",
    href: "https://scholar.google.com/citations?user=NOvshPMAAAAJ&hl=en",
    linkTitle: `${SITE.title} on Google Scholar`,
    icon: "googlescholar",
    active: true,
  },
  {
    name: "X",
    href: "https://x.com/NoeFlandre",
    linkTitle: `${SITE.title} on X`,
    icon: "twitter",
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/no%C3%A9flandre/",
    linkTitle: `${SITE.title} on LinkedIn`,
    icon: "linkedin",
    active: true,
  },
  {
    name: "Email",
    href: "mailto:noeflandre@gmail.com",
    linkTitle: `Email ${SITE.title}`,
    icon: "mail",
    active: true,
  },
  {
    name: "CV",
    href: "/assets/docs/noe-flandre-cv.pdf",
    linkTitle: `View ${SITE.title} CV (PDF)`,
    icon: "cv",
    active: true,
  },
] as const;

export const SHARE_LINKS = [
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Share this post on X`,
    icon: "twitter",
  },
  {
    name: "BlueSky",
    href: "https://bsky.app/intent/compose?text=",
    linkTitle: `Share this post on BlueSky`,
    icon: "bluesky",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/sharing/share-offsite/?url=",
    linkTitle: `Share this post on LinkedIn`,
    icon: "linkedin",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: `Share this post via WhatsApp`,
    icon: "whatsapp",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: `Share this post on Facebook`,
    icon: "facebook",
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: `Share this post via Telegram`,
    icon: "telegram",
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: `Share this post on Pinterest`,
    icon: "pinterest",
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: "mail",
  },
] as const;
