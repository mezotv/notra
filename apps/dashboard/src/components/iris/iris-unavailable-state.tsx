import { RainbowIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  IRIS_UNAVAILABLE_DESCRIPTION,
  IRIS_UNAVAILABLE_TITLE,
} from "@/constants/iris";

export function IrisUnavailableState() {
  return (
    <div className="border-border mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border p-8 text-center">
      <span className="border-border inline-flex size-11 items-center justify-center rounded-2xl border">
        <HugeiconsIcon className="size-5" icon={RainbowIcon} />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">
        {IRIS_UNAVAILABLE_TITLE}
      </h1>
      <p className="text-muted-foreground text-sm text-balance">
        {IRIS_UNAVAILABLE_DESCRIPTION}
      </p>
    </div>
  );
}
