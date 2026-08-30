import {
  BookOpen01Icon,
  BubbleChatQuestionIcon,
  GitCompareIcon,
  GlobalIcon,
  Layers01Icon,
  LeftToRightListNumberIcon,
  PaintBrush01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";

export const GEO_WRITE_CONTENT_SUBTYPES = [
  {
    id: "guide" as const,
    label: "Guide",
    description: "A long article that answers the prompt directly.",
    icon: BookOpen01Icon,
    iconClass: "text-muted-foreground",
  },
  {
    id: "listicle" as const,
    label: "Listicle",
    description: "A numbered list that buyers can scan and cite.",
    icon: LeftToRightListNumberIcon,
    iconClass: "text-muted-foreground",
  },
  {
    id: "comparison" as const,
    label: "Comparison",
    description: "Compares the brand with its alternatives.",
    icon: GitCompareIcon,
    iconClass: "text-muted-foreground",
  },
];

export const GEO_WRITE_DIALOG_SECTIONS = [
  {
    id: "prompt" as const,
    label: "Prompt",
    required: true,
    icon: BubbleChatQuestionIcon,
  },
  {
    id: "type" as const,
    label: "Format",
    required: true,
    icon: Layers01Icon,
  },
  {
    id: "brand" as const,
    label: "Brand identity",
    required: false,
    icon: PaintBrush01Icon,
  },
  {
    id: "sitemap" as const,
    label: "Sitemap",
    required: false,
    icon: GlobalIcon,
  },
  {
    id: "competitors" as const,
    label: "Competitors",
    required: false,
    icon: UserMultiple02Icon,
  },
];
