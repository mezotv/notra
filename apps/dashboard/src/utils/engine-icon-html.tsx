import { renderToStaticMarkup } from "react-dom/server";

import { EngineIcon } from "@/components/geo/engine-icon";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";
import { modelsDevLogoUrl, splitModelId } from "@/utils/geo-model-display";
import { prefixSvgIds, svgIdPrefix } from "@/utils/svg-ids";

const TOOLTIP_ICON_CLASS = "size-3.5";
const TOOLTIP_ICON_IMG_PX = 14;
const engineIconHtmlCache = new Map<string, string>();

export function engineIconHtml(engine: string, darkSurface = true): string {
  const cacheKey = `${engine}:${darkSurface ? "dark" : "themed"}`;
  const cached = engineIconHtmlCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const html = resolveEngineIconKey(engine)
    ? prefixSvgIds(
        renderToStaticMarkup(
          <span
            aria-hidden="true"
            className="inline-flex size-3.5 shrink-0 items-center justify-center"
          >
            <EngineIcon
              className={TOOLTIP_ICON_CLASS}
              darkSurface={darkSurface}
              engine={engine}
            />
          </span>
        ),
        svgIdPrefix(`tooltip-${cacheKey}`)
      )
    : providerLogoImgHtml(engine);
  engineIconHtmlCache.set(cacheKey, html);
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
