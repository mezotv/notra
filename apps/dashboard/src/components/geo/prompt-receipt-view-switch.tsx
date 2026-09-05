"use client";

import {
  GEO_PROMPT_RECEIPT_VIEW_GROUP_LABEL,
  GEO_PROMPT_RECEIPT_VIEW_LABELS,
} from "@notra/geo-core/constants/geo";
import {
  PermissionOption,
  PermissionRow,
} from "@notra/ui/components/ui/permission-selector";

import type { PromptReceiptViewSwitchProps } from "@/types/geo";

export function PromptReceiptViewSwitch({
  view,
  onChange,
}: PromptReceiptViewSwitchProps) {
  return (
    <PermissionRow
      className="w-fit shrink-0"
      label={GEO_PROMPT_RECEIPT_VIEW_GROUP_LABEL}
      layout="compact"
      onValueChange={(value) => {
        if (value === "analysis" || value === "raw") {
          onChange(value);
        }
      }}
      value={view}
    >
      <PermissionOption value="analysis">
        {GEO_PROMPT_RECEIPT_VIEW_LABELS.analysis}
      </PermissionOption>
      <PermissionOption value="raw">
        {GEO_PROMPT_RECEIPT_VIEW_LABELS.raw}
      </PermissionOption>
    </PermissionRow>
  );
}
