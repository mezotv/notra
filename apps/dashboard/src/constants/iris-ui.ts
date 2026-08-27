import { Note01Icon, RssIcon, Sent02Icon } from "@hugeicons/core-free-icons";

import type { IrisExplainerStep } from "@/types/iris";

export const IRIS_EXPLAINER_STEPS: IrisExplainerStep[] = [
  {
    key: "watch",
    icon: RssIcon,
    title: "Watches your sources",
    description:
      "Every release, merge, and push you ship lands in front of Iris.",
  },
  {
    key: "draft",
    icon: Note01Icon,
    title: "Drafts the story",
    description:
      "Changelogs, blog posts with images, and social posts, written in your voice.",
  },
  {
    key: "ship",
    icon: Sent02Icon,
    title: "You say ship it",
    description:
      "Iris reports to Slack and waits for your go before anything goes live.",
  },
];
