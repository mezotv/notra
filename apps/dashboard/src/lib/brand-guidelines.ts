import {
  captureScreenshot,
  retrieveBrand,
  retrieveStyleguide,
} from "@notra/ai/utils/context-dev";
import { db } from "@notra/db/drizzle";
import {
  brandGuidelineAssets,
  brandGuidelineColors,
  brandGuidelineFonts,
  brandGuidelineScreenshots,
  brandGuidelines,
  brandGuidelineTokens,
} from "@notra/db/schema";
import { asc, eq } from "drizzle-orm";
import { Data, Effect } from "effect";
import { BRAND_GUIDELINE_SCREENSHOT_CONFIGS } from "@/constants/brand-guidelines";
import type { NormalizedScreenshot } from "@/types/brand-guidelines";
import {
  dedupeColors,
  extractAssets,
  extractFonts,
  extractLogoColors,
  extractStyleguideColors,
  extractTokens,
  getBrandGuidelineHostname,
  getScreenshotUrl,
  normalizeBrandGuidelineSourceUrl,
  serializeGuidelinesResponse,
} from "@/utils/brand-guidelines";

class BrandGuidelineGenerationError extends Data.TaggedError(
  "BrandGuidelineGenerationError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

async function getGuidelineByBrandSettingsId(brandSettingsId: string) {
  return db.query.brandGuidelines.findFirst({
    where: eq(brandGuidelines.brandSettingsId, brandSettingsId),
    with: {
      assets: { orderBy: [asc(brandGuidelineAssets.sortOrder)] },
      colors: { orderBy: [asc(brandGuidelineColors.sortOrder)] },
      fonts: { orderBy: [asc(brandGuidelineFonts.sortOrder)] },
      screenshots: { orderBy: [asc(brandGuidelineScreenshots.sortOrder)] },
      tokens: { orderBy: [asc(brandGuidelineTokens.sortOrder)] },
    },
  });
}

export async function getBrandGuidelines(brandSettingsId: string) {
  return serializeGuidelinesResponse(
    await getGuidelineByBrandSettingsId(brandSettingsId)
  );
}

export const generateBrandGuidelines = Effect.fn("generateBrandGuidelines")(
  function* (input: { brandSettingsId: string; sourceUrl: string }) {
    const sourceUrl = yield* Effect.try({
      try: () => normalizeBrandGuidelineSourceUrl(input.sourceUrl),
      catch: (cause) =>
        new BrandGuidelineGenerationError({
          message: "Invalid brand guideline source URL",
          cause,
        }),
    });

    const domain = yield* Effect.try({
      try: () => getBrandGuidelineHostname(sourceUrl),
      catch: (cause) =>
        new BrandGuidelineGenerationError({
          message: "Invalid brand guideline source domain",
          cause,
        }),
    });

    const [brand, styleguide] = yield* Effect.tryPromise({
      try: () =>
        Promise.all([retrieveBrand(domain), retrieveStyleguide(domain)]),
      catch: (cause) =>
        new BrandGuidelineGenerationError({
          message: "Failed to retrieve Context.dev brand guidelines",
          cause,
        }),
    });

    const screenshotResponses = yield* Effect.tryPromise({
      try: () =>
        Promise.all(
          BRAND_GUIDELINE_SCREENSHOT_CONFIGS.map((config) =>
            captureScreenshot({
              domain,
              format: "png",
              height: config.height,
              screenshotType: config.fullPage ? "fullPage" : "viewport",
              timeoutMS: 30_000,
              width: config.width,
            })
          )
        ),
      catch: (cause) =>
        new BrandGuidelineGenerationError({
          message: "Failed to capture Context.dev screenshots",
          cause,
        }),
    });

    const capturedAt = new Date();
    const screenshots = yield* Effect.try({
      try: () =>
        screenshotResponses.map((response, index) => {
          const config = BRAND_GUIDELINE_SCREENSHOT_CONFIGS[index];
          if (!config) {
            throw new BrandGuidelineGenerationError({
              message: "Missing screenshot configuration",
              cause: { index, response },
            });
          }

          const url = getScreenshotUrl(response);

          if (!url) {
            throw new BrandGuidelineGenerationError({
              message: `Context.dev screenshot response did not include a URL for ${config.kind}`,
              cause: response,
            });
          }

          return {
            kind: config.kind,
            url,
            storageKey: null,
            width:
              (typeof response.screenshot === "object"
                ? response.screenshot.width
                : response.width) ?? config.width,
            height:
              (typeof response.screenshot === "object"
                ? response.screenshot.height
                : response.height) ?? config.height,
            format:
              (typeof response.screenshot === "object"
                ? response.screenshot.format
                : undefined) ?? "png",
            fullPage: config.fullPage,
            capturedAt,
            metadata: response,
            sortOrder: config.sortOrder,
          } satisfies NormalizedScreenshot;
        }),
      catch: (cause) =>
        cause instanceof BrandGuidelineGenerationError
          ? cause
          : new BrandGuidelineGenerationError({
              message: "Failed to normalize Context.dev screenshots",
              cause,
            }),
    });

    const styleguideColors = extractStyleguideColors(styleguide);
    const colors = dedupeColors([
      ...styleguideColors,
      ...extractLogoColors(brand, styleguideColors.length),
    ]);
    const fonts = extractFonts(styleguide);
    const tokens = extractTokens(styleguide);
    const assets = extractAssets(brand);
    const guidelineId = crypto.randomUUID();
    const now = new Date();

    yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const existing = await tx.query.brandGuidelines.findFirst({
            where: eq(brandGuidelines.brandSettingsId, input.brandSettingsId),
            columns: { id: true },
          });
          const nextGuidelineId = existing?.id ?? guidelineId;

          if (existing) {
            await tx
              .update(brandGuidelines)
              .set({
                status: "ready",
                contextDevMeta: {
                  brand: { code: brand.code, status: brand.status },
                  styleguide: {
                    code: styleguide.code,
                    status: styleguide.status,
                  },
                },
                lastGeneratedAt: now,
                lastGenerationError: null,
                updatedAt: now,
              })
              .where(eq(brandGuidelines.id, nextGuidelineId));
          } else {
            await tx.insert(brandGuidelines).values({
              id: nextGuidelineId,
              brandSettingsId: input.brandSettingsId,
              status: "ready",
              contextDevMeta: {
                brand: { code: brand.code, status: brand.status },
                styleguide: {
                  code: styleguide.code,
                  status: styleguide.status,
                },
              },
              lastGeneratedAt: now,
              lastGenerationError: null,
              createdAt: now,
              updatedAt: now,
            });
          }

          await tx
            .delete(brandGuidelineAssets)
            .where(eq(brandGuidelineAssets.guidelineId, nextGuidelineId));
          await tx
            .delete(brandGuidelineColors)
            .where(eq(brandGuidelineColors.guidelineId, nextGuidelineId));
          await tx
            .delete(brandGuidelineFonts)
            .where(eq(brandGuidelineFonts.guidelineId, nextGuidelineId));
          await tx
            .delete(brandGuidelineScreenshots)
            .where(eq(brandGuidelineScreenshots.guidelineId, nextGuidelineId));
          await tx
            .delete(brandGuidelineTokens)
            .where(eq(brandGuidelineTokens.guidelineId, nextGuidelineId));

          if (assets.length > 0) {
            await tx.insert(brandGuidelineAssets).values(
              assets.map((asset) => ({
                id: crypto.randomUUID(),
                guidelineId: nextGuidelineId,
                ...asset,
              }))
            );
          }

          if (colors.length > 0) {
            await tx.insert(brandGuidelineColors).values(
              colors.map((color) => ({
                id: crypto.randomUUID(),
                guidelineId: nextGuidelineId,
                ...color,
              }))
            );
          }

          if (fonts.length > 0) {
            await tx.insert(brandGuidelineFonts).values(
              fonts.map((font) => ({
                id: crypto.randomUUID(),
                guidelineId: nextGuidelineId,
                ...font,
              }))
            );
          }

          if (screenshots.length > 0) {
            await tx.insert(brandGuidelineScreenshots).values(
              screenshots.map((screenshot) => ({
                id: crypto.randomUUID(),
                guidelineId: nextGuidelineId,
                ...screenshot,
              }))
            );
          }

          if (tokens.length > 0) {
            await tx.insert(brandGuidelineTokens).values(
              tokens.map((token) => ({
                id: crypto.randomUUID(),
                guidelineId: nextGuidelineId,
                ...token,
              }))
            );
          }
        }),
      catch: (cause) =>
        new BrandGuidelineGenerationError({
          message: "Failed to store brand guidelines",
          cause,
        }),
    });

    return yield* Effect.tryPromise({
      try: () => getBrandGuidelines(input.brandSettingsId),
      catch: (cause) =>
        new BrandGuidelineGenerationError({
          message: "Failed to load stored brand guidelines",
          cause,
        }),
    });
  }
);

export async function markBrandGuidelinesFailed(input: {
  brandSettingsId: string;
  error: string;
}) {
  const now = new Date();
  const existing = await db.query.brandGuidelines.findFirst({
    where: eq(brandGuidelines.brandSettingsId, input.brandSettingsId),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(brandGuidelines)
      .set({
        status: "failed",
        lastGenerationError: input.error,
        updatedAt: now,
      })
      .where(eq(brandGuidelines.id, existing.id));
    return;
  }

  await db.insert(brandGuidelines).values({
    id: crypto.randomUUID(),
    brandSettingsId: input.brandSettingsId,
    status: "failed",
    lastGenerationError: input.error,
    createdAt: now,
    updatedAt: now,
  });
}
