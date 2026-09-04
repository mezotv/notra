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

export const GEO_WRITE_ACTION_HELP = {
  plan: "Plan creates a brief you review before anything is drafted.",
  write: "Write plans and drafts the article in one step.",
} as const;

export const GEO_WRITE_EDIT_NOTE =
  "Editing the text creates a custom variant that is no longer linked to the tracked prompt.";

export const GEO_WRITE_RECOMMENDED_BADGE = "Recommended";

export const GEO_WRITE_COMPETITOR_DETAIL = {
  mentioned: "Recommended instead of you",
  tracked: "Tracked",
} as const;

export const GEO_WRITE_FORMAT_RULES = [
  {
    id: "comparison" as const,
    pattern:
      /\b(vs\.?|versus|compare|comparison|difference between|better than|alternatives?)\b/i,
    reason:
      "The prompt compares options, so a comparison page matches its intent.",
  },
  {
    id: "listicle" as const,
    pattern:
      /\b(best|top \d*|list of|tools?|platforms?|software|apps?|options|examples|companies|providers|vendors)\b/i,
    reason:
      "The prompt asks for options, so a scannable list is what assistants quote.",
  },
] as const;

export const GEO_WRITE_FORMAT_DEFAULT_REASON =
  "The prompt asks a direct question, so a guide that answers it first fits best.";
