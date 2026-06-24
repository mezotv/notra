import type {
  ContextDevBrandRetrieveResponse,
  ContextDevScreenshotResponse,
  ContextDevStyleguideResponse,
} from "@notra/ai/types/context-dev";
import {
  BRAND_GUIDELINE_HEX_COLOR_REGEX,
  BRAND_GUIDELINE_LEADING_WWW_REGEX,
  BRAND_GUIDELINE_TOKEN_GROUPS,
} from "@/constants/brand-guidelines";
import type {
  NormalizedAsset,
  NormalizedColor,
  NormalizedFont,
  NormalizedToken,
  StoredBrandGuideline,
} from "@/types/brand-guidelines";
import type {
  BrandGuidelinesResponse,
  BrandGuidelineTokenType,
} from "@/types/hooks/brand-guidelines";
import { selectPreferredBrandGuidelineAssets } from "@/utils/brand-guideline-assets";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function objectValue(value: unknown) {
  return isRecord(value) ? value : null;
}

export function normalizeBrandGuidelineSourceUrl(rawUrl: string) {
  return new URL(rawUrl).href;
}

export function getBrandGuidelineHostname(rawUrl: string) {
  return new URL(rawUrl).hostname.replace(
    BRAND_GUIDELINE_LEADING_WWW_REGEX,
    ""
  );
}

function normalizeColorRole(role: string) {
  const normalized = role.toLowerCase();
  if (normalized.includes("primary")) {
    return "primary";
  }
  if (normalized.includes("secondary")) {
    return "secondary";
  }
  if (normalized.includes("accent")) {
    return "accent";
  }
  if (normalized.includes("background")) {
    return "background";
  }
  if (normalized.includes("text") || normalized.includes("foreground")) {
    return "foreground";
  }
  if (normalized.includes("neutral") || normalized.includes("gray")) {
    return "neutral";
  }
  return "custom";
}

function normalizeFontRole(role: string) {
  const normalized = role.toLowerCase();
  if (normalized.includes("heading") || normalized.startsWith("h")) {
    return "heading";
  }
  if (normalized.includes("body") || normalized.includes("paragraph")) {
    return "body";
  }
  if (normalized.includes("button")) {
    return "button";
  }
  return "unknown";
}

function normalizeTokenType(type: string): BrandGuidelineTokenType {
  const normalized = type.toLowerCase();
  if (normalized.includes("spacing")) {
    return "spacing";
  }
  if (normalized.includes("radius") || normalized.includes("radii")) {
    return "radius";
  }
  if (normalized.includes("shadow")) {
    return "shadow";
  }
  if (normalized.includes("component")) {
    return "component";
  }
  return "unknown";
}

function getDarkColorValue(color: Record<string, unknown>) {
  return (
    stringValue(color.darkHex) ??
    stringValue(color.darkValue) ??
    stringValue(color.dark)
  );
}

export function extractStyleguideColors(
  styleguide: ContextDevStyleguideResponse
): NormalizedColor[] {
  const colors = objectValue(styleguide.styleguide.colors);

  if (!colors) {
    return [];
  }

  return Object.entries(colors).flatMap(([key, value], index) => {
    if (
      typeof value === "string" &&
      BRAND_GUIDELINE_HEX_COLOR_REGEX.test(value)
    ) {
      return [
        {
          role: normalizeColorRole(key),
          name: key,
          lightValue: value,
          darkValue: null,
          usage: null,
          sortOrder: index,
        },
      ];
    }

    const color = objectValue(value);
    const hex = stringValue(color?.hex);
    const darkHex = color ? getDarkColorValue(color) : null;

    if (!hex || !BRAND_GUIDELINE_HEX_COLOR_REGEX.test(hex)) {
      return [];
    }

    return [
      {
        role: normalizeColorRole(key),
        name: stringValue(color?.name) ?? key,
        lightValue: hex,
        darkValue:
          darkHex && BRAND_GUIDELINE_HEX_COLOR_REGEX.test(darkHex)
            ? darkHex
            : null,
        usage: stringValue(color?.usage),
        sortOrder: index,
      },
    ];
  });
}

export function extractLogoColors(
  brand: ContextDevBrandRetrieveResponse,
  startSortOrder: number
): NormalizedColor[] {
  return (brand.brand.logos ?? []).flatMap((logo, logoIndex) =>
    (logo.colors ?? []).flatMap((color, colorIndex) => {
      if (!color.hex || !BRAND_GUIDELINE_HEX_COLOR_REGEX.test(color.hex)) {
        return [];
      }

      return [
        {
          role: "custom",
          name: color.name ?? null,
          lightValue: color.hex,
          darkValue: null,
          usage: logo.type ? `${logo.type} logo` : "logo",
          sortOrder: startSortOrder + logoIndex * 10 + colorIndex,
        },
      ];
    })
  );
}

export function dedupeColors(colors: NormalizedColor[]) {
  const seen = new Set<string>();

  return colors.filter((color) => {
    const key = `${color.role}:${color.lightValue.toLowerCase()}:${color.darkValue?.toLowerCase() ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function extractFonts(
  styleguide: ContextDevStyleguideResponse
): NormalizedFont[] {
  const typography = objectValue(styleguide.styleguide.typography);

  if (!typography) {
    return [];
  }

  const entries = Object.entries(typography).flatMap(([key, value]) => {
    if (key === "headings") {
      const headings = objectValue(value);
      return headings ? Object.entries(headings) : [];
    }

    return [[key, value] as const];
  });

  return entries.flatMap(([key, value], index) => {
    const token = objectValue(value);
    const family = stringValue(token?.fontFamily) ?? stringValue(value);

    if (!family) {
      return [];
    }

    return [
      {
        role: normalizeFontRole(key),
        family,
        weight:
          stringValue(token?.fontWeight) ??
          stringValue(token?.weight) ??
          (typeof token?.fontWeight === "number"
            ? String(token.fontWeight)
            : null),
        size: stringValue(token?.fontSize) ?? stringValue(token?.size),
        lineHeight:
          stringValue(token?.lineHeight) ??
          (typeof token?.lineHeight === "number"
            ? String(token.lineHeight)
            : null),
        source: "styleguide",
        sortOrder: index,
      },
    ];
  });
}

function extractTokenGroup(
  styleguide: ContextDevStyleguideResponse,
  groupName: string,
  startSortOrder: number
): NormalizedToken[] {
  const group = objectValue(styleguide.styleguide[groupName]);

  if (!group) {
    return [];
  }

  return Object.entries(group).flatMap(([key, value], index) => {
    const stringToken = stringValue(value);
    const numericToken =
      typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : null;
    const recordToken = objectValue(value);
    const recordValue =
      stringValue(recordToken?.value) ??
      stringValue(recordToken?.boxShadow) ??
      stringValue(recordToken?.borderRadius);
    const tokenValue = stringToken ?? numericToken ?? recordValue;

    if (!tokenValue) {
      return [];
    }

    return [
      {
        type: normalizeTokenType(groupName),
        name: key,
        value: tokenValue,
        source: "styleguide",
        metadata: recordToken,
        sortOrder: startSortOrder + index,
      },
    ];
  });
}

export function extractTokens(styleguide: ContextDevStyleguideResponse) {
  return BRAND_GUIDELINE_TOKEN_GROUPS.flatMap((groupName, groupIndex) =>
    extractTokenGroup(styleguide, groupName, groupIndex * 100)
  );
}

export function extractAssets(brand: ContextDevBrandRetrieveResponse) {
  const now = new Date();

  return selectPreferredBrandGuidelineAssets(brand.brand.logos ?? []).map(
    (asset): NormalizedAsset => ({
      aspectRatio: asset.aspectRatio,
      capturedAt: now,
      format: asset.format,
      height: asset.height,
      kind: asset.kind,
      metadata: asset.logo,
      mimeType: asset.mimeType,
      sortOrder: asset.sortOrder,
      storageKey: null,
      url: asset.url,
      variant: asset.variant,
      width: asset.width,
    })
  );
}

export function getScreenshotUrl(response: ContextDevScreenshotResponse) {
  if (typeof response.screenshot === "string") {
    return response.screenshot;
  }

  return (
    response.url ??
    response.screenshotUrl ??
    response.imageUrl ??
    response.screenshot?.url ??
    null
  );
}

function serializeGuidelineDate(value: Date | null) {
  return value?.toISOString() ?? null;
}

export function serializeGuidelinesResponse(
  guideline: StoredBrandGuideline | null | undefined
): BrandGuidelinesResponse {
  if (!guideline) {
    return {
      guideline: null,
      assets: [],
      colors: [],
      fonts: [],
      screenshots: [],
      tokens: [],
    };
  }

  return {
    guideline: {
      id: guideline.id,
      brandSettingsId: guideline.brandSettingsId,
      status: guideline.status,
      contextDevMeta: guideline.contextDevMeta,
      lastGeneratedAt: serializeGuidelineDate(guideline.lastGeneratedAt),
      lastGenerationError: guideline.lastGenerationError,
      createdAt: guideline.createdAt.toISOString(),
      updatedAt: guideline.updatedAt.toISOString(),
    },
    assets: guideline.assets.map((asset) => ({
      id: asset.id,
      guidelineId: asset.guidelineId,
      kind: asset.kind,
      url: asset.url,
      storageKey: asset.storageKey,
      format: asset.format,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.aspectRatio,
      variant: asset.variant,
      capturedAt: serializeGuidelineDate(asset.capturedAt),
      metadata: asset.metadata,
      sortOrder: asset.sortOrder,
    })),
    colors: guideline.colors.map((color) => ({
      id: color.id,
      guidelineId: color.guidelineId,
      role: color.role,
      name: color.name,
      lightValue: color.lightValue,
      darkValue: color.darkValue,
      usage: color.usage,
      sortOrder: color.sortOrder,
    })),
    fonts: guideline.fonts.map((font) => ({
      id: font.id,
      guidelineId: font.guidelineId,
      role: font.role,
      family: font.family,
      weight: font.weight,
      size: font.size,
      lineHeight: font.lineHeight,
      source: font.source,
      sortOrder: font.sortOrder,
    })),
    screenshots: guideline.screenshots.map((screenshot) => ({
      id: screenshot.id,
      guidelineId: screenshot.guidelineId,
      kind: screenshot.kind,
      url: screenshot.url,
      storageKey: screenshot.storageKey,
      width: screenshot.width,
      height: screenshot.height,
      format: screenshot.format,
      fullPage: screenshot.fullPage,
      capturedAt: serializeGuidelineDate(screenshot.capturedAt),
      metadata: screenshot.metadata,
      sortOrder: screenshot.sortOrder,
    })),
    tokens: guideline.tokens.map((token) => ({
      id: token.id,
      guidelineId: token.guidelineId,
      type: token.type,
      name: token.name,
      value: token.value,
      source: token.source,
      metadata: token.metadata,
      sortOrder: token.sortOrder,
    })),
  };
}
