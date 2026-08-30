import { GEO_BRAND_LABELS, GEO_ENGINE_LABELS } from "../constants/geo";
import { resolveEngineIconKey } from "./geo-engine-icon";

export const GROUNDED_SUFFIX_PATTERN = /(-direct)?-grounded$/;

export function engineModelOf(engine: string): string {
  return engine.replace(GROUNDED_SUFFIX_PATTERN, "");
}

export function engineFamilyOf(engine: string): string {
  return resolveEngineIconKey(engine) ?? engineModelOf(engine);
}

export function engineFamilyLabel(family: string): string {
  return (
    GEO_BRAND_LABELS[family] ??
    GEO_ENGINE_LABELS[family] ??
    GEO_ENGINE_LABELS[`${family}-grounded`] ??
    family
  );
}
