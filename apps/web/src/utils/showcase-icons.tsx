import { BetterAuthLight } from "@notra/ui/components/ui/svgs/betterAuthLight";
import { Cal } from "@notra/ui/components/ui/svgs/cal";
import { Databuddy } from "@notra/ui/components/ui/svgs/databuddy";
import { Langfuse } from "@notra/ui/components/ui/svgs/langfuse";
import { Marble } from "@notra/ui/components/ui/svgs/marble";
import { Neon } from "@notra/ui/components/ui/svgs/neon";
import Image from "next/image";
import type { ReactNode } from "react";

export const SHOWCASE_COMPANY_ICONS: Record<string, ReactNode> = {
  "better-auth": <BetterAuthLight className="size-5" />,
  "cal-com": <Cal className="size-5" />,
  databuddy: <Databuddy className="size-5 rounded" />,
  langfuse: <Langfuse className="size-5" />,
  autumn: (
    <Image
      alt="Autumn"
      className="h-5 w-auto rounded"
      height={85}
      src="/logos/brands/autumn.avif"
      width={53}
    />
  ),
  marble: <Marble className="size-5 rounded" />,
  neon: <Neon className="size-5 rounded" />,
  openclaw: (
    <Image
      alt="OpenClaw"
      className="h-5 w-auto rounded"
      height={85}
      src="/logos/brands/openclaw.webp"
      width={53}
    />
  ),
  unkey: (
    <Image
      alt="Unkey"
      className="h-5 w-auto rounded"
      height={85}
      src="/logos/brands/unkey.webp"
      width={53}
    />
  ),
};
