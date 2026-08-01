import { RainbowIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  IRIS_UNAVAILABLE_DESCRIPTION,
  IRIS_UNAVAILABLE_TITLE,
} from "@/constants/iris";

export function IrisUnavailableState() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border border-border p-8 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border">
        <HugeiconsIcon className="size-5" icon={RainbowIcon} />
      </span>
      <h1 className="font-semibold text-xl tracking-tight">
        {IRIS_UNAVAILABLE_TITLE}
      </h1>
      <p className="text-balance text-muted-foreground text-sm">
        {IRIS_UNAVAILABLE_DESCRIPTION}
      </p>
    </div>
  );
}
