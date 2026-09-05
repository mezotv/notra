import {
  GEO_PROMPT_INTENT_LABELS,
  GEO_PROMPT_INTENTS,
} from "@notra/geo-core/constants/geo";

import type {
  GeoPromptFilterOption,
  GeoPromptIntentFilter,
  GeoPromptSourceFilter,
  GeoPromptTableFilters,
} from "@/types/geo";

export const GEO_PROMPT_FILTER_ALL = "all";
export const GEO_PROMPT_INTENT_FILTER_VALUES = [
  GEO_PROMPT_FILTER_ALL,
  ...GEO_PROMPT_INTENTS,
] as const;
export const GEO_PROMPT_SOURCE_FILTER_VALUES = [
  GEO_PROMPT_FILTER_ALL,
  "custom",
  "auto",
] as const;
export const GEO_PROMPT_DEFAULT_FILTERS: GeoPromptTableFilters = {
  q: "",
  intent: GEO_PROMPT_FILTER_ALL,
  tag: GEO_PROMPT_FILTER_ALL,
  source: GEO_PROMPT_FILTER_ALL,
};
export const GEO_PROMPT_INTENT_FILTER_OPTIONS: GeoPromptFilterOption<GeoPromptIntentFilter>[] =
  [
    { value: GEO_PROMPT_FILTER_ALL, label: "All intents" },
    ...GEO_PROMPT_INTENTS.map((intent) => ({
      value: intent,
      label: GEO_PROMPT_INTENT_LABELS[intent],
    })),
  ];
export const GEO_PROMPT_SOURCE_FILTER_OPTIONS: GeoPromptFilterOption<GeoPromptSourceFilter>[] =
  [
    { value: GEO_PROMPT_FILTER_ALL, label: "All sources" },
    { value: "custom", label: "Custom" },
    { value: "auto", label: "Auto" },
  ];
export const GEO_PROMPT_SOURCE_LABELS: Record<GeoPromptSourceFilter, string> = {
  all: "All sources",
  custom: "Custom",
  auto: "Auto",
};
export const GEO_PROMPT_TAG_FILTER_ALL_LABEL = "All tags";
export const GEO_PROMPT_TAGS_VISIBLE_COUNT = 3;
export const GEO_PROMPT_SAVED_VIEWS_MAX = 20;
export const GEO_PROMPT_VIEW_NAME_MAX_LENGTH = 40;
export const GEO_PROMPT_FILTER_SELECT_CLASS = "w-36";
export const GEO_PROMPT_VIEWS_COPY = {
  trigger: "Views",
  save: "Save current view",
  empty: "No saved views yet",
  saved: "Saved views",
  saveTitle: "Save view",
  saveDescription:
    "Name this combination of search and filters so you can reapply it later.",
  nameLabel: "Name",
  namePlaceholder: "Comparison prompts",
  confirm: "Save view",
  cancel: "Cancel",
  remove: "Delete view",
  applied: "View applied",
  savedToast: "View saved",
  removedToast: "View deleted",
} as const;
export const GEO_PROMPT_TAGS_COPY = {
  column: "Tags",
  intentColumn: "Intent",
  edit: "Edit tags",
  editDescription: "Tags group prompts so you can filter and save views.",
  bulk: "Add tag",
  bulkTitle: "Add tags",
  bulkDescription: "Tags are added to every selected custom prompt.",
  label: "Tags",
  placeholder: "Type a tag and press Enter",
  suggestions: "Tags in use",
  confirm: "Save tags",
  bulkConfirm: "Add tags",
  cancel: "Cancel",
  none: "No tags",
} as const;
