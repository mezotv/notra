"use client";

import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { resolveEngineIconKey } from "@notra/ui/lib/geo-engine-icon";
import {
  modelsDevLogoUrl,
  splitModelId,
} from "@notra/ui/lib/geo-model-display";
import { renderToStaticMarkup } from "react-dom/server";

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
