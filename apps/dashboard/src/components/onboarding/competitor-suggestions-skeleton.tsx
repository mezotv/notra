import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { ONBOARDING_SUGGESTION_SKELETON_ROWS } from "@/constants/onboarding";

export function CompetitorSuggestionsSkeleton() {
  return (
    <ul className="space-y-1.5">
      {ONBOARDING_SUGGESTION_SKELETON_ROWS.map((row) => (
        <li
          className="border-input flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
          key={row}
        >
          <Skeleton className="size-8 rounded-md" />
          <span className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </span>
          <Skeleton className="size-6 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
