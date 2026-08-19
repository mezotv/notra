"use client";

import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Deepseek } from "@notra/ui/components/ui/svgs/deepseek";
import { Gemini } from "@notra/ui/components/ui/svgs/gemini";
import { Grok } from "@notra/ui/components/ui/svgs/grok";
import { GrokDark } from "@notra/ui/components/ui/svgs/grokDark";
import { Meta } from "@notra/ui/components/ui/svgs/meta";
import { MicrosoftCopilot } from "@notra/ui/components/ui/svgs/microsoftCopilot";
import { Mistral } from "@notra/ui/components/ui/svgs/mistral";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { OpenaiDark } from "@notra/ui/components/ui/svgs/openaiDark";
import { Perplexity } from "@notra/ui/components/ui/svgs/perplexity";
import { Qwen } from "@notra/ui/components/ui/svgs/qwen";
import { QwenDark } from "@notra/ui/components/ui/svgs/qwenDark";
import { cn } from "@/lib/utils";
import type { EngineIconProps } from "@/types/geo";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";

export function EngineIcon({ engine, className }: EngineIconProps) {
  const key = resolveEngineIconKey(engine);
  if (!key) {
    return null;
  }

  const iconClass = cn("size-4 shrink-0", className);

  if (key === "openai") {
    return (
      <>
        <Openai className={cn(iconClass, "block dark:hidden")} />
        <OpenaiDark className={cn(iconClass, "hidden dark:block")} />
      </>
    );
  }
  if (key === "grok") {
    return (
      <>
        <Grok className={cn(iconClass, "block dark:hidden")} />
        <GrokDark className={cn(iconClass, "hidden dark:block")} />
      </>
    );
  }
  if (key === "qwen") {
    return (
      <>
        <Qwen className={cn(iconClass, "block dark:hidden")} />
        <QwenDark className={cn(iconClass, "hidden dark:block")} />
      </>
    );
  }
  if (key === "claude") {
    return <ClaudeAiIcon className={iconClass} />;
  }
  if (key === "gemini") {
    return <Gemini className={iconClass} />;
  }
  if (key === "perplexity") {
    return <Perplexity className={iconClass} />;
  }
  if (key === "mistral") {
    return <Mistral className={iconClass} />;
  }
  if (key === "deepseek") {
    return <Deepseek className={iconClass} />;
  }
  if (key === "meta") {
    return <Meta className={iconClass} />;
  }
  return <MicrosoftCopilot className={iconClass} />;
}
