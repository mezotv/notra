export type ReviewDiffKind = "equal" | "add" | "remove";

export interface ReviewDiffSegment {
  kind: ReviewDiffKind;
  value: string;
}
