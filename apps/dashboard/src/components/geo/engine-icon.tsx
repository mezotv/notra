"use client";

import {
  ComputerTerminal01Icon,
  Robot01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { EngineIconKey } from "@notra/geo-core/types/geo";
import { resolveEngineIconKey } from "@notra/geo-core/utils/geo-engine-icon";
import { Amazon } from "@notra/ui/components/ui/svgs/amazon";
import { Apple } from "@notra/ui/components/ui/svgs/apple";
import { AppleDark } from "@notra/ui/components/ui/svgs/appleDark";
import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Cline } from "@notra/ui/components/ui/svgs/cline";
import { Cloudflare } from "@notra/ui/components/ui/svgs/cloudflare";
import { Cohere } from "@notra/ui/components/ui/svgs/cohere";
import { CommonCrawl } from "@notra/ui/components/ui/svgs/commonCrawl";
import { Cursor } from "@notra/ui/components/ui/svgs/cursor";
import { Deepseek } from "@notra/ui/components/ui/svgs/deepseek";
import { Devin } from "@notra/ui/components/ui/svgs/devin";
import { Diffbot } from "@notra/ui/components/ui/svgs/diffbot";
import { DuckDuckGo } from "@notra/ui/components/ui/svgs/duckDuckGo";
import { Exa } from "@notra/ui/components/ui/svgs/exa";
import { Firecrawl } from "@notra/ui/components/ui/svgs/firecrawl";
import { FirecrawlDark } from "@notra/ui/components/ui/svgs/firecrawlDark";
import { Firefox } from "@notra/ui/components/ui/svgs/firefox";
import { Gemini } from "@notra/ui/components/ui/svgs/gemini";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { Grok } from "@notra/ui/components/ui/svgs/grok";
import { GrokDark } from "@notra/ui/components/ui/svgs/grokDark";
import { Huawei } from "@notra/ui/components/ui/svgs/huawei";
import { Kagi } from "@notra/ui/components/ui/svgs/kagi";
import { Kimi } from "@notra/ui/components/ui/svgs/kimi";
import { Liner } from "@notra/ui/components/ui/svgs/liner";
import { Manus } from "@notra/ui/components/ui/svgs/manus";
import { ManusDark } from "@notra/ui/components/ui/svgs/manusDark";
import { Meta } from "@notra/ui/components/ui/svgs/meta";
import { MicrosoftCopilot } from "@notra/ui/components/ui/svgs/microsoftCopilot";
import { Mistral } from "@notra/ui/components/ui/svgs/mistral";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { OpenaiDark } from "@notra/ui/components/ui/svgs/openaiDark";
import { Opencode } from "@notra/ui/components/ui/svgs/opencode";
import { OpencodeDark } from "@notra/ui/components/ui/svgs/opencodeDark";
import { Perplexity } from "@notra/ui/components/ui/svgs/perplexity";
import { Qwen } from "@notra/ui/components/ui/svgs/qwen";
import { QwenDark } from "@notra/ui/components/ui/svgs/qwenDark";
import { Tavily } from "@notra/ui/components/ui/svgs/tavily";
import { Tencent } from "@notra/ui/components/ui/svgs/tencent";
import { TikTok } from "@notra/ui/components/ui/svgs/tikTok";
import { TikTokDark } from "@notra/ui/components/ui/svgs/tikTokDark";
import { Timpi } from "@notra/ui/components/ui/svgs/timpi";
import { Xiaomi } from "@notra/ui/components/ui/svgs/xiaomi";
import { YouCom } from "@notra/ui/components/ui/svgs/youCom";
import { Zai } from "@notra/ui/components/ui/svgs/zai";
import type { ComponentType, SVGProps } from "react";

import { ModelProviderLogo } from "@/components/geo/model-provider-logo";
import { cn } from "@/lib/utils";
import type { EngineIconProps } from "@/types/geo";
import { splitModelId } from "@/utils/geo-model-display";

export function EngineIcon(props: EngineIconProps) {
  return (
    <span aria-hidden="true" className="contents">
      <EngineIconGraphic {...props} />
    </span>
  );
}

function EngineIconGraphic({
  engine,
  className,
  darkSurface,
}: EngineIconProps) {
  const key = resolveEngineIconKey(engine);
  if (!key) {
    const parsed = splitModelId(engine);
    if (!parsed) {
      return null;
    }
    return (
      <ModelProviderLogo className={className} provider={parsed.provider} />
    );
  }

  const iconClass = cn("size-4 shrink-0", className);

  if (key === "openai") {
    if (darkSurface) {
      return <OpenaiDark className={iconClass} />;
    }
    return (
      <>
        <Openai className={cn(iconClass, "block dark:hidden")} />
        <OpenaiDark className={cn(iconClass, "hidden dark:block")} />
      </>
    );
  }
  if (key === "grok") {
    return themedIcon(Grok, GrokDark, iconClass, darkSurface);
  }
  if (key === "qwen") {
    if (darkSurface) {
      return <QwenDark className={iconClass} />;
    }
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
    return <Gemini className={cn(iconClass, "overflow-visible")} />;
  }
  if (key === "perplexity") {
    return (
      <Perplexity className={cn(iconClass, darkSurface && "brightness-150")} />
    );
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
  if (key === "tencent") {
    return <Tencent className={iconClass} />;
  }
  if (key === "xiaomi") {
    return <Xiaomi className={iconClass} />;
  }
  if (key === "cursor") {
    return <Cursor className={iconClass} />;
  }
  if (key === "google") {
    return <Google className={iconClass} />;
  }
  if (key === "duckduckgo") {
    return <DuckDuckGo className={iconClass} />;
  }
  if (key === "cloudflare") {
    return <Cloudflare className={iconClass} />;
  }
  if (key === "mozilla") {
    return <Firefox className={iconClass} />;
  }
  if (key === "cohere") {
    return <Cohere className={iconClass} />;
  }
  if (key === "kimi") {
    return <Kimi className={iconClass} />;
  }
  if (key === "apple") {
    return themedIcon(Apple, AppleDark, iconClass, darkSurface);
  }
  if (key === "tiktok") {
    return themedIcon(TikTok, TikTokDark, iconClass, darkSurface);
  }
  if (key === "manus") {
    return themedIcon(Manus, ManusDark, iconClass, darkSurface);
  }
  if (key === "firecrawl") {
    return themedIcon(Firecrawl, FirecrawlDark, iconClass, darkSurface);
  }
  if (key === "opencode") {
    return themedIcon(Opencode, OpencodeDark, iconClass, darkSurface);
  }
  const simple = SIMPLE_ICONS[key];
  if (simple) {
    const Icon = simple;
    return <Icon className={iconClass} />;
  }
  if (key === "agent") {
    return <HugeiconsIcon className={iconClass} icon={Robot01Icon} />;
  }
  if (key === "cli") {
    return (
      <HugeiconsIcon className={iconClass} icon={ComputerTerminal01Icon} />
    );
  }
  return <MicrosoftCopilot className={iconClass} />;
}

const SIMPLE_ICONS: Partial<
  Record<EngineIconKey, ComponentType<SVGProps<SVGSVGElement>>>
> = {
  amazon: Amazon,
  exa: Exa,
  commoncrawl: CommonCrawl,
  youcom: YouCom,
  liner: Liner,
  cline: Cline,
  devin: Devin,
  diffbot: Diffbot,
  tavily: Tavily,
  timpi: Timpi,
  huawei: Huawei,
  kagi: Kagi,
  zai: Zai,
};

function themedIcon(
  Light: ComponentType<SVGProps<SVGSVGElement>>,
  Dark: ComponentType<SVGProps<SVGSVGElement>>,
  iconClass: string,
  darkSurface = false
) {
  if (darkSurface) {
    return <Dark className={iconClass} />;
  }
  return (
    <>
      <Light className={cn(iconClass, "block dark:hidden")} />
      <Dark className={cn(iconClass, "hidden dark:block")} />
    </>
  );
}
