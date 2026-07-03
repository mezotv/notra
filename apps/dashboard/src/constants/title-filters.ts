import type { TitleFilterMatchType } from "@/schemas/title-filters";
import type { TitleFilterPreset } from "@/types/title-filters";

export const TITLE_FILTER_MATCH_TYPE_OPTIONS: Array<{
  value: TitleFilterMatchType;
  label: string;
}> = [
  { value: "contains", label: "Contains text" },
  { value: "regex", label: "Regex" },
];

const TITLE_FILTER_PRESETS: TitleFilterPreset[] = [
  {
    id: "docs",
    label: "Docs",
    description: 'Excludes "docs: ..." and "docs(scope): ..." titles',
    matchType: "regex",
    pattern: "^docs(\\(.*\\))?!?:",
  },
  {
    id: "chore",
    label: "Chores",
    description: 'Excludes "chore: ..." and "chore(scope): ..." titles',
    matchType: "regex",
    pattern: "^chore(\\(.*\\))?!?:",
  },
  {
    id: "ci",
    label: "CI & build",
    description: 'Excludes "ci: ..." and "build: ..." titles',
    matchType: "regex",
    pattern: "^(ci|build)(\\(.*\\))?!?:",
  },
  {
    id: "tests",
    label: "Tests",
    description: 'Excludes "test: ..." and "tests(scope): ..." titles',
    matchType: "regex",
    pattern: "^tests?(\\(.*\\))?!?:",
  },
  {
    id: "deps",
    label: "Dependency bumps",
    description:
      'Excludes dependency updates like "chore(deps): ..." and "bump ..."',
    matchType: "regex",
    pattern: "^(chore|fix|build)\\(deps.*\\)!?:|^bump ",
  },
  {
    id: "reverts",
    label: "Reverts",
    description: 'Excludes "revert ..." titles',
    matchType: "regex",
    pattern: "^revert\\b",
  },
  {
    id: "merges",
    label: "Merge commits",
    description:
      'Excludes "Merge branch ..." and "Merge pull request ..." titles',
    matchType: "regex",
    pattern: "^merge (branch|pull request|remote)\\b",
  },
  {
    id: "wip",
    label: "WIP",
    description: 'Excludes "wip: ..." and "[WIP] ..." titles',
    matchType: "regex",
    pattern: "^\\[?wip\\]?\\b",
  },
];

const LINEAR_PRESET_IDS = new Set(["docs", "chore", "tests", "wip"]);

export const GITHUB_TITLE_FILTER_PRESETS = TITLE_FILTER_PRESETS;

export const LINEAR_TITLE_FILTER_PRESETS = TITLE_FILTER_PRESETS.filter(
  (preset) => LINEAR_PRESET_IDS.has(preset.id)
);
