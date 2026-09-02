import type {
  GeoBriefInternalLink,
  GeoContentBrief,
  GeoContentSubtype,
} from "@notra/ai/types/geo-writer";
import type { Ref } from "react";

export interface ContentPlanViewProps {
  brief: GeoContentBrief;
  initialBrief?: GeoContentBrief;
  isWriting?: boolean;
  onChange?: (brief: GeoContentBrief) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export interface PlanTextProps {
  "aria-label": string;
  autoFocus?: boolean;
  className?: string;
  itemId?: string;
  maxLength?: number;
  onChange: (value: string) => void;
  onCommit?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
  value: string;
}

export interface PlanLineListProps {
  addLabel: string;
  itemAriaLabel: (index: number) => string;
  itemClassName?: string;
  items: KeyedPlanLine[];
  maxItems: number;
  onCommit: () => void;
  onItemsChange: (items: KeyedPlanLine[]) => void;
  placeholder: string;
  readOnly: boolean;
  removeAriaLabel: (index: number) => string;
  showBullet?: boolean;
}

export interface KeyedPlanLine {
  id: string;
  text: string;
}

export interface KeyedPlanSection {
  id: string;
  heading: string;
  goal: string;
  claims: KeyedPlanLine[];
}

export interface KeyedPlanLink extends GeoBriefInternalLink {
  id: string;
}

export interface KeyedContentPlan {
  targetPrompt: string;
  intent: string;
  contentSubtype: GeoContentSubtype;
  workingTitle: string;
  audience: string;
  jobToBeDone: string;
  sections: KeyedPlanSection[];
  questionsToAnswer: KeyedPlanLine[];
  internalLinks: KeyedPlanLink[];
  acceptanceChecklist: KeyedPlanLine[];
}
