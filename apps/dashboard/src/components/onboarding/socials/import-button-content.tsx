import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2Icon } from "lucide-react";
import { ONBOARDING_IMPORT_COUNT } from "@/lib/onboarding/constants";
import type { ImportButtonContentProps } from "@/types/components/socials-onboarding";

export function ImportButtonContent({
  isPending,
  importedCount,
}: ImportButtonContentProps) {
  if (isPending) {
    return (
      <>
        <Loader2Icon className="size-4 animate-spin" />
        Importing tweets...
      </>
    );
  }
  if (importedCount > 0) {
    return (
      <>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
        Imported {importedCount} tweet{importedCount === 1 ? "" : "s"}
      </>
    );
  }
  return `Import ${ONBOARDING_IMPORT_COUNT} recent tweets`;
}
