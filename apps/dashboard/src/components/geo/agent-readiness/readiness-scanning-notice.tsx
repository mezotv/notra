import { AiScanIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { AgentReadinessScanningNoticeProps } from "@/types/agent-readiness";
import { stripWebsiteProtocol } from "@/utils/geo-website";

export function AgentReadinessScanningNotice({
  targetUrl,
}: AgentReadinessScanningNoticeProps) {
  const domain = stripWebsiteProtocol(targetUrl);

  return (
    <section
      aria-busy="true"
      aria-label={`Scanning ${domain}`}
      aria-live="polite"
      className="bg-card overflow-hidden rounded-2xl border shadow-2xs"
    >
      <div className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6">
        <div className="bg-primary/10 text-primary relative flex size-11 shrink-0 items-center justify-center rounded-xl">
          <span className="bg-primary/10 agent-readiness-pulse absolute inset-0 rounded-xl" />
          <HugeiconsIcon className="relative size-5" icon={AiScanIcon} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium">
            Scanning <strong className="font-semibold">{domain}</strong>…
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Checking how AI agents discover, understand, and use your website.
          </p>
        </div>

        <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
          <span className="bg-primary agent-readiness-pulse size-1.5 rounded-full" />
          In progress
        </span>
      </div>

      <div
        aria-label="Scan in progress"
        className="bg-muted relative h-1 overflow-hidden"
        role="progressbar"
      >
        <div className="agent-readiness-progress bg-primary absolute inset-y-0 w-1/3 rounded-full" />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs sm:px-6">
        <span>Analyzing public site signals</span>
        <span>Usually 1–3 minutes</span>
      </div>
    </section>
  );
}
