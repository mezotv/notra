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
import { Tencent } from "@notra/ui/components/ui/svgs/tencent";
import { Xiaomi } from "@notra/ui/components/ui/svgs/xiaomi";
import { renderToStaticMarkup } from "react-dom/server";
import { ModelProviderLogo } from "@/components/geo/model-provider-logo";
import { cn } from "@/lib/utils";
import type { EngineIconProps } from "@/types/geo";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";
import { modelsDevLogoUrl, splitModelId } from "@/utils/geo-model-display";

export function EngineIcon({ engine, className }: EngineIconProps) {
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
    return <Gemini className={cn(iconClass, "overflow-visible")} />;
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
  if (key === "tencent") {
    return <Tencent className={iconClass} />;
  }
  if (key === "xiaomi") {
    return <Xiaomi className={iconClass} />;
  }
  return <MicrosoftCopilot className={iconClass} />;
}

const TOOLTIP_ICON_CLASS = "size-3.5";
const TOOLTIP_ICON_IMG_PX = 14;
const engineIconHtmlCache = new Map<string, string>();

export function engineIconHtml(engine: string): string {
  const cached = engineIconHtmlCache.get(engine);
  if (cached !== undefined) {
    return cached;
  }
  const html = resolveEngineIconKey(engine)
    ? renderToStaticMarkup(
        <span
          aria-hidden="true"
          className="inline-flex size-3.5 shrink-0 items-center justify-center"
        >
          <EngineIcon className={TOOLTIP_ICON_CLASS} engine={engine} />
        </span>
      )
    : providerLogoImgHtml(engine);
  engineIconHtmlCache.set(engine, html);
  return html;
}

function providerLogoImgHtml(engine: string): string {
  const parsed = splitModelId(engine);
  if (!parsed) {
    return "";
  }
  const src = modelsDevLogoUrl(parsed.provider);
  return `<img alt="" class="size-3.5 shrink-0 dark:invert" height="${TOOLTIP_ICON_IMG_PX}" src="${src}" width="${TOOLTIP_ICON_IMG_PX}" />`;
}
