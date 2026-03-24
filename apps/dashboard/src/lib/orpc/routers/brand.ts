import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  brandReferences,
  brandSettings,
  connectedSocialAccounts,
  contentTriggers,
} from "@notra/db/schema";
import { deleteBrandReferenceMemory } from "@notra/db/utils/supermemory";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { FEATURES } from "@/constants/features";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import { baseProcedure } from "@/lib/orpc/base";
import { getWorkflowClient } from "@/lib/qstash";
import { redis } from "@/lib/redis";
import { deleteQstashSchedule, getAppUrl } from "@/lib/triggers/qstash";
import {
  analyzeBrandSchema,
  createReferenceSchema,
  fetchTweetSchema,
  importTweetsSchema,
  updateBrandSettingsSchema,
  updateReferenceSchema,
} from "@/schemas/brand";
import type { BrandSettings as BrandVoiceOutput } from "@/types/hooks/brand-analysis";
import type {
  ApplicablePlatform,
  BrandReference as BrandReferenceOutput,
} from "@/types/hooks/brand-references";
import type {
  TwitterTimelineResponse,
  TwitterTweet,
  TwitterUser,
} from "@/types/services/twitter";
import {
  type ReferenceMemoryRecord,
  removeBrandReferenceMemory,
  syncBrandReferenceMemory,
} from "@/utils/brand-reference-memory";
import { ratelimit } from "@/utils/ratelimit";
import { twitterFetch } from "@/utils/twitter-auth";
import { fetchTweet } from "@/utils/twitter-fetcher";
import {
  badRequest,
  conflict,
  forbidden,
  internalServerError,
  notFound,
  tooManyRequests,
} from "../utils/errors";

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const voiceInputSchema = organizationIdInputSchema.extend({
  voiceId: z.string().min(1, "Voice ID is required"),
});

const voiceCreateInputSchema = organizationIdInputSchema.extend({
  name: z.string().optional(),
  websiteUrl: z.string().min(1, "Website URL is required"),
});

const voiceUpdateInputSchema = organizationIdInputSchema
  .extend({
    voiceId: z.string().min(1, "Voice ID is required"),
  })
  .and(updateBrandSettingsSchema.omit({ id: true }));

const referenceInputSchema = voiceInputSchema.extend({
  referenceId: z.string().min(1, "Reference ID is required"),
});

const analyzeInputSchema = organizationIdInputSchema.extend({
  voiceId: z.string().optional(),
  url: analyzeBrandSchema.shape.url,
});

const setDefaultVoiceInputSchema = organizationIdInputSchema.extend({
  voiceId: z.string().min(1, "Voice ID is required"),
});

export interface ProgressData {
  status:
    | "idle"
    | "scraping"
    | "extracting"
    | "saving"
    | "completed"
    | "failed";
  currentStep: number;
  totalSteps: number;
  error?: string;
}

const typeDefaults: Record<string, ApplicablePlatform[]> = {
  twitter_post: ["twitter"],
  linkedin_post: ["linkedin"],
  blog_post: ["blog"],
};

async function verifyVoiceOwnership(organizationId: string, voiceId: string) {
  const voice = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, voiceId),
      eq(brandSettings.organizationId, organizationId)
    ),
  });

  if (!voice) {
    throw notFound("Brand voice not found");
  }

  return voice;
}

async function getTriggersForBrandVoice(
  organizationId: string,
  voiceId: string
) {
  const allTriggers = await db.query.contentTriggers.findMany({
    where: eq(contentTriggers.organizationId, organizationId),
  });

  return allTriggers.filter((trigger) => {
    const config = trigger.outputConfig as { brandVoiceId?: string } | null;
    return config?.brandVoiceId === voiceId;
  });
}

async function getReferenceById(referenceId: string, voiceId: string) {
  return db.query.brandReferences.findFirst({
    where: and(
      eq(brandReferences.id, referenceId),
      eq(brandReferences.brandSettingsId, voiceId)
    ),
  });
}

function isMemorySyncFieldUpdate(data: {
  applicableTo?: string[];
  content?: string;
  note?: string | null;
}) {
  return (
    Object.hasOwn(data, "content") ||
    Object.hasOwn(data, "note") ||
    Object.hasOwn(data, "applicableTo")
  );
}

function normalizeBrandVoiceWebsiteUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    throw badRequest("Website URL is required");
  }

  const websiteUrl = trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
  const parsed = z.url().safeParse(websiteUrl);

  if (!parsed.success) {
    throw badRequest("Invalid website URL");
  }

  return websiteUrl;
}

async function fetchPinnedTweet(
  userId: string,
  account: {
    id: string;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
  }
): Promise<TwitterTweet | null> {
  const params = new URLSearchParams({
    "user.fields": "pinned_tweet_id",
    expansions: "pinned_tweet_id",
    "tweet.fields":
      "text,created_at,public_metrics,author_id,referenced_tweets",
  });

  const response = await twitterFetch(
    `https://api.x.com/2/users/${userId}?${params.toString()}`,
    account
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return (data.includes?.tweets?.[0] as TwitterTweet | undefined) ?? null;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function serializeBrandVoice(voice: {
  audience: string | null;
  companyDescription: string | null;
  companyName: string | null;
  createdAt: Date;
  customInstructions: string | null;
  customTone: string | null;
  id: string;
  isDefault: boolean;
  language: string | null;
  name: string;
  organizationId: string;
  toneProfile: string | null;
  updatedAt: Date;
  websiteUrl: string | null;
}): BrandVoiceOutput {
  return {
    id: voice.id,
    organizationId: voice.organizationId,
    name: voice.name,
    isDefault: voice.isDefault,
    websiteUrl: voice.websiteUrl,
    companyName: voice.companyName,
    companyDescription: voice.companyDescription,
    toneProfile: voice.toneProfile,
    customTone: voice.customTone,
    customInstructions: voice.customInstructions,
    audience: voice.audience,
    language: voice.language,
    createdAt: voice.createdAt.toISOString(),
    updatedAt: voice.updatedAt.toISOString(),
  };
}

function serializeBrandReference(reference: {
  applicableTo: ("all" | "twitter" | "linkedin" | "blog")[];
  brandSettingsId: string;
  content: string;
  createdAt: Date;
  id: string;
  metadata: unknown;
  note: string | null;
  supermemoryDocumentId: string | null;
  supermemoryLastSyncError: string | null;
  supermemoryMemoryId: string | null;
  supermemorySyncedAt: Date | null;
  type: "custom" | "twitter_post" | "linkedin_post" | "blog_post";
  updatedAt: Date;
}): BrandReferenceOutput {
  return {
    id: reference.id,
    brandSettingsId: reference.brandSettingsId,
    type: reference.type,
    content: reference.content,
    metadata:
      reference.metadata && typeof reference.metadata === "object"
        ? (reference.metadata as Record<string, unknown>)
        : null,
    note: reference.note,
    supermemoryDocumentId: reference.supermemoryDocumentId,
    supermemoryMemoryId: reference.supermemoryMemoryId,
    supermemorySyncedAt: reference.supermemorySyncedAt?.toISOString() ?? null,
    supermemoryLastSyncError: reference.supermemoryLastSyncError,
    applicableTo: reference.applicableTo,
    createdAt: reference.createdAt.toISOString(),
    updatedAt: reference.updatedAt.toISOString(),
  };
}

export const brandRouter = {
  voices: {
    list: baseProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const voices = await db.query.brandSettings.findMany({
          where: eq(brandSettings.organizationId, input.organizationId),
          orderBy: [
            desc(brandSettings.isDefault),
            asc(brandSettings.createdAt),
          ],
        });

        return { voices: voices.map(serializeBrandVoice) };
      }),
    create: baseProcedure
      .input(voiceCreateInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const name =
          typeof input.name === "string" && input.name.trim()
            ? input.name.trim()
            : "Untitled Brand Voice";
        const websiteUrl = normalizeBrandVoiceWebsiteUrl(input.websiteUrl);

        const existingVoice = await db.query.brandSettings.findFirst({
          where: and(
            eq(brandSettings.organizationId, input.organizationId),
            eq(brandSettings.name, name)
          ),
        });

        if (existingVoice) {
          throw conflict("A brand voice with this name already exists");
        }

        const hasAnyVoice = await db.query.brandSettings.findFirst({
          where: eq(brandSettings.organizationId, input.organizationId),
          columns: { id: true },
        });

        try {
          const voice = await db
            .insert(brandSettings)
            .values({
              id: randomUUID(),
              organizationId: input.organizationId,
              name,
              isDefault: !hasAnyVoice,
              websiteUrl,
            })
            .returning();

          const createdVoice = voice[0];

          if (!createdVoice) {
            throw internalServerError("Failed to create brand voice");
          }

          return { voice: serializeBrandVoice(createdVoice) };
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw conflict("A brand voice with this name already exists");
          }

          throw internalServerError("Failed to create brand voice", error);
        }
      }),
    update: baseProcedure
      .input(voiceUpdateInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        try {
          const {
            organizationId: _organizationId,
            voiceId: _voiceId,
            ...updates
          } = input;

          await db
            .update(brandSettings)
            .set({
              ...updates,
              updatedAt: new Date(),
            })
            .where(eq(brandSettings.id, input.voiceId));

          const voices = await db.query.brandSettings.findMany({
            where: eq(brandSettings.organizationId, input.organizationId),
            orderBy: [
              desc(brandSettings.isDefault),
              asc(brandSettings.createdAt),
            ],
          });

          return { voices: voices.map(serializeBrandVoice) };
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw conflict("A brand voice with this name already exists");
          }

          throw internalServerError("Failed to update brand settings", error);
        }
      }),
    delete: baseProcedure
      .input(voiceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const voice = await verifyVoiceOwnership(
          input.organizationId,
          input.voiceId
        );

        if (voice.isDefault) {
          throw badRequest("Cannot delete the default voice");
        }

        const affectedTriggers = await getTriggersForBrandVoice(
          input.organizationId,
          input.voiceId
        );

        for (const trigger of affectedTriggers) {
          if (trigger.qstashScheduleId) {
            await deleteQstashSchedule(trigger.qstashScheduleId).catch(
              (error) => {
                console.error(
                  `Failed to delete qstash schedule ${trigger.qstashScheduleId}:`,
                  error
                );
              }
            );
          }
        }

        await db.transaction(async (tx) => {
          if (affectedTriggers.length > 0) {
            await tx
              .update(contentTriggers)
              .set({
                enabled: false,
                qstashScheduleId: null,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(contentTriggers.organizationId, input.organizationId),
                  inArray(
                    contentTriggers.id,
                    affectedTriggers.map((trigger) => trigger.id)
                  )
                )
              );
          }

          await tx
            .delete(brandSettings)
            .where(
              and(
                eq(brandSettings.id, input.voiceId),
                eq(brandSettings.organizationId, input.organizationId)
              )
            );
        });

        return {
          success: true,
          disabledSchedules: affectedTriggers
            .filter((trigger) => trigger.sourceType === "cron")
            .map((trigger) => ({ id: trigger.id, name: trigger.name })),
          disabledEvents: affectedTriggers
            .filter((trigger) => trigger.sourceType !== "cron")
            .map((trigger) => ({ id: trigger.id, name: trigger.name })),
        };
      }),
    setDefault: baseProcedure
      .input(setDefaultVoiceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        await db.transaction(async (tx) => {
          await tx
            .update(brandSettings)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(
              and(
                eq(brandSettings.organizationId, input.organizationId),
                eq(brandSettings.isDefault, true)
              )
            );

          await tx
            .update(brandSettings)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(brandSettings.id, input.voiceId));
        });

        const voices = await db.query.brandSettings.findMany({
          where: eq(brandSettings.organizationId, input.organizationId),
          orderBy: [
            desc(brandSettings.isDefault),
            asc(brandSettings.createdAt),
          ],
        });

        return { voices: voices.map(serializeBrandVoice) };
      }),
    affectedTriggers: baseProcedure
      .input(voiceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        const affectedTriggers = await getTriggersForBrandVoice(
          input.organizationId,
          input.voiceId
        );

        return {
          affectedSchedules: affectedTriggers
            .filter((trigger) => trigger.sourceType === "cron")
            .map((trigger) => ({
              id: trigger.id,
              name: trigger.name,
              enabled: trigger.enabled,
            })),
          affectedEvents: affectedTriggers
            .filter((trigger) => trigger.sourceType !== "cron")
            .map((trigger) => ({
              id: trigger.id,
              name: trigger.name,
              enabled: trigger.enabled,
            })),
        };
      }),
  },
  analysis: {
    getProgress: baseProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const progress = redis
          ? await redis.get<ProgressData>(
              `brand:progress:${input.organizationId}`
            )
          : null;

        return {
          progress:
            progress ??
            ({
              status: "idle",
              currentStep: 0,
              totalSteps: 3,
            } satisfies ProgressData),
        };
      }),
    start: baseProcedure
      .input(analyzeInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await getWorkflowClient().trigger({
          url: `${getAppUrl()}/api/workflows/brand-analysis`,
          body: {
            organizationId: input.organizationId,
            url: input.url,
            voiceId: input.voiceId || undefined,
          },
        });

        return {
          success: true,
          message: "Brand analysis started",
        };
      }),
  },
  references: {
    list: baseProcedure
      .input(voiceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        const references = await db.query.brandReferences.findMany({
          where: eq(brandReferences.brandSettingsId, input.voiceId),
          orderBy: [desc(brandReferences.createdAt)],
        });

        return { references: references.map(serializeBrandReference) };
      }),
    create: baseProcedure
      .input(voiceInputSchema.and(createReferenceSchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        const metadata = input.metadata ?? null;
        const tweetId = (metadata as Record<string, unknown> | null)?.tweetId;

        if (tweetId) {
          const existing = await db.query.brandReferences.findFirst({
            where: and(
              eq(brandReferences.brandSettingsId, input.voiceId),
              sql`${brandReferences.metadata}->>'tweetId' = ${String(tweetId)}`
            ),
            columns: { id: true },
          });

          if (existing) {
            throw conflict("This tweet has already been added as a reference");
          }
        }

        const applicableTo: ApplicablePlatform[] = input.applicableTo ??
          typeDefaults[input.type] ?? ["all"];

        if (autumn) {
          let data: { allowed?: boolean } | null = null;

          try {
            data = await autumn.check({
              customerId: input.organizationId,
              featureId: FEATURES.REFERENCES,
              requiredBalance: 1,
              sendEvent: true,
            });
          } catch {
            data = null;
          }

          if (!data?.allowed) {
            throw forbidden(
              "Reference limit reached. Upgrade your plan to add more."
            );
          }
        }

        const inserted = await db
          .insert(brandReferences)
          .values({
            id: randomUUID(),
            brandSettingsId: input.voiceId,
            type: input.type,
            content: input.content,
            metadata,
            note: input.note ?? null,
            applicableTo,
          })
          .returning();

        const reference = inserted[0];

        if (!reference) {
          throw internalServerError("Reference was not created");
        }

        let createdDocumentId: string | null = null;

        try {
          const link = await syncBrandReferenceMemory({
            organizationId: input.organizationId,
            voiceId: input.voiceId,
            reference: reference as ReferenceMemoryRecord,
          });
          createdDocumentId = link.documentId;

          const synced = await db
            .update(brandReferences)
            .set({
              supermemoryDocumentId: link.documentId,
              supermemoryMemoryId: link.memoryId,
              supermemorySyncedAt: new Date(),
              supermemoryLastSyncError: null,
            })
            .where(eq(brandReferences.id, reference.id))
            .returning();

          const syncedReference = synced[0];

          if (!syncedReference) {
            throw internalServerError("Reference was not created");
          }

          return { reference: serializeBrandReference(syncedReference) };
        } catch (error) {
          await db
            .delete(brandReferences)
            .where(eq(brandReferences.id, reference.id));

          if (createdDocumentId) {
            try {
              await deleteBrandReferenceMemory({
                documentId: createdDocumentId,
              });
            } catch (cleanupError) {
              console.error(
                "Error cleaning up failed Supermemory reference:",
                cleanupError
              );
            }
          }

          if (autumn) {
            await autumn.track({
              customerId: input.organizationId,
              featureId: FEATURES.REFERENCES,
              value: -1,
            });
          }

          throw internalServerError(
            "Failed to sync reference to memory",
            error
          );
        }
      }),
    update: baseProcedure
      .input(referenceInputSchema.and(updateReferenceSchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        const existing = await getReferenceById(
          input.referenceId,
          input.voiceId
        );

        if (!existing) {
          throw notFound("Reference not found");
        }

        const updated = await db
          .update(brandReferences)
          .set({
            note: input.note,
            content: input.content,
            applicableTo: input.applicableTo,
            updatedAt: new Date(),
          })
          .where(eq(brandReferences.id, input.referenceId))
          .returning();

        const reference = updated[0];

        if (!reference) {
          throw internalServerError("Reference update failed");
        }

        if (
          !isMemorySyncFieldUpdate({
            content: input.content,
            note: input.note,
            applicableTo: input.applicableTo,
          })
        ) {
          return { reference: serializeBrandReference(reference) };
        }

        let createdDocumentId: string | null = null;

        try {
          const link = await syncBrandReferenceMemory({
            organizationId: input.organizationId,
            voiceId: input.voiceId,
            reference: reference as ReferenceMemoryRecord,
          });
          createdDocumentId = link.documentId;

          await db
            .update(brandReferences)
            .set({
              supermemoryDocumentId: link.documentId,
              supermemoryMemoryId: link.memoryId,
              supermemorySyncedAt: new Date(),
              supermemoryLastSyncError: null,
            })
            .where(eq(brandReferences.id, input.referenceId));

          if (
            existing.supermemoryDocumentId &&
            existing.supermemoryDocumentId !== link.documentId
          ) {
            try {
              await removeBrandReferenceMemory(
                existing as ReferenceMemoryRecord
              );
            } catch (cleanupError) {
              console.error(
                "Error deleting stale reference memory:",
                cleanupError
              );

              await db
                .update(brandReferences)
                .set({
                  supermemoryLastSyncError:
                    "Reference updated, but the previous Supermemory document could not be deleted.",
                })
                .where(eq(brandReferences.id, input.referenceId));
            }
          }

          const refreshedReference = await getReferenceById(
            input.referenceId,
            input.voiceId
          );

          if (!refreshedReference) {
            throw internalServerError("Reference update refresh failed");
          }

          return { reference: serializeBrandReference(refreshedReference) };
        } catch (error) {
          console.error(
            "Error syncing updated reference to Supermemory:",
            error
          );

          if (createdDocumentId) {
            try {
              await deleteBrandReferenceMemory({
                documentId: createdDocumentId,
              });
            } catch (cleanupError) {
              console.error(
                "Error cleaning up failed updated Supermemory reference:",
                cleanupError
              );
            }
          }

          await db
            .update(brandReferences)
            .set({
              supermemoryLastSyncError:
                error instanceof Error
                  ? error.message
                  : "Supermemory sync failed",
            })
            .where(eq(brandReferences.id, input.referenceId));

          throw internalServerError(
            "Reference updated, but memory sync failed",
            error
          );
        }
      }),
    delete: baseProcedure
      .input(referenceInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        const existing = await getReferenceById(
          input.referenceId,
          input.voiceId
        );

        if (!existing) {
          throw notFound("Reference not found");
        }

        try {
          await removeBrandReferenceMemory(existing as ReferenceMemoryRecord);
        } catch (error) {
          console.error("Error deleting reference memory:", error);
        }

        await db
          .delete(brandReferences)
          .where(eq(brandReferences.id, input.referenceId));

        if (autumn) {
          await autumn.track({
            customerId: input.organizationId,
            featureId: FEATURES.REFERENCES,
            value: -1,
          });
        }

        return { success: true };
      }),
    importTweets: baseProcedure
      .input(voiceInputSchema.and(importTweetsSchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const { success: withinLimit } = await ratelimit.importTweets.limit(
          input.organizationId
        );

        if (!withinLimit) {
          throw tooManyRequests(
            "Too many import requests. Please try again shortly."
          );
        }

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        let maxResults = input.maxResults;

        if (autumn) {
          let data: {
            allowed?: boolean;
            balance?: { unlimited?: boolean; remaining?: number } | null;
          } | null = null;

          try {
            data = await autumn.check({
              customerId: input.organizationId,
              featureId: FEATURES.REFERENCES,
              requiredBalance: 1,
            });
          } catch {
            data = null;
          }

          if (!data?.allowed) {
            throw forbidden(
              "Reference limit reached. Upgrade your plan to import more."
            );
          }

          if (
            !data.balance?.unlimited &&
            typeof data.balance?.remaining === "number"
          ) {
            maxResults = Math.min(maxResults, data.balance.remaining);
          }
        }

        const socialAccount = await db.query.connectedSocialAccounts.findFirst({
          where: and(
            eq(connectedSocialAccounts.id, input.accountId),
            eq(connectedSocialAccounts.organizationId, input.organizationId),
            eq(connectedSocialAccounts.provider, "twitter")
          ),
        });

        if (!socialAccount) {
          throw notFound("Connected X account not found");
        }

        const pinnedTweet = await fetchPinnedTweet(
          socialAccount.providerAccountId,
          socialAccount
        );

        const originalTweets: TwitterTweet[] = [];
        let author: TwitterUser | undefined;
        let paginationToken: string | undefined;
        const maxPages = 5;

        for (let page = 0; page < maxPages; page += 1) {
          const remaining = maxResults - originalTweets.length;
          const perPage = Math.min(20, Math.max(5, remaining));

          const tweetParams = new URLSearchParams({
            max_results: String(perPage),
            exclude: "replies,retweets",
            "tweet.fields":
              "text,created_at,public_metrics,author_id,referenced_tweets",
            "user.fields": "username,name,profile_image_url",
            expansions: "author_id",
          });

          if (paginationToken) {
            tweetParams.set("pagination_token", paginationToken);
          }

          const tweetsResponse = await twitterFetch(
            `https://api.x.com/2/users/${socialAccount.providerAccountId}/tweets?${tweetParams.toString()}`,
            socialAccount
          );

          if (!tweetsResponse.ok) {
            if (page === 0) {
              const errorBody = await tweetsResponse.json().catch(() => ({}));
              const message =
                (errorBody as Record<string, string>)?.detail ||
                (errorBody as Record<string, string>)?.title ||
                "Failed to fetch tweets from X";

              throw badRequest(message);
            }

            break;
          }

          const timeline: TwitterTimelineResponse = await tweetsResponse.json();

          if (!author && timeline.includes?.users) {
            author =
              timeline.includes.users.find(
                (user) => user.id === socialAccount.providerAccountId
              ) ?? timeline.includes.users[0];
          }

          const filtered = (timeline.data ?? []).filter(
            (tweet) =>
              !tweet.referenced_tweets?.some(
                (reference) =>
                  reference.type === "quoted" || reference.type === "replied_to"
              )
          );

          for (const tweet of filtered) {
            originalTweets.push(tweet);

            if (originalTweets.length >= maxResults) {
              break;
            }
          }

          if (
            originalTweets.length >= maxResults ||
            !timeline.meta?.next_token
          ) {
            break;
          }

          paginationToken = timeline.meta.next_token;
        }

        let tweets = originalTweets;
        const isPinnedOriginal =
          pinnedTweet &&
          !pinnedTweet.referenced_tweets?.some(
            (reference) =>
              reference.type === "quoted" || reference.type === "replied_to"
          );

        if (isPinnedOriginal) {
          tweets = tweets.filter((tweet) => tweet.id !== pinnedTweet.id);
          tweets.unshift(pinnedTweet);
        }

        tweets = tweets.slice(0, maxResults);

        if (tweets.length === 0) {
          return { count: 0, references: [] };
        }

        const authorHandle = author?.username ?? socialAccount.username;
        const authorName = author?.name ?? socialAccount.displayName;
        const profileImageUrl = author?.profile_image_url
          ? normalizeTwitterProfileImageUrl(author.profile_image_url)
          : socialAccount.profileImageUrl;
        const incomingIds = tweets.map((tweet) => tweet.id);

        const existingRefs = await db.query.brandReferences.findMany({
          where: and(
            eq(brandReferences.brandSettingsId, input.voiceId),
            sql`${brandReferences.metadata}->>'tweetId' = ANY(ARRAY[${sql.join(
              incomingIds.map((id) => sql`${id}`),
              sql`, `
            )}]::text[])`
          ),
          columns: { metadata: true },
        });

        const existingTweetIds = new Set(
          existingRefs
            .map((reference) => {
              return (reference.metadata as Record<string, unknown> | null)
                ?.tweetId;
            })
            .filter(Boolean)
        );

        const newTweets = tweets.filter(
          (tweet) => !existingTweetIds.has(tweet.id)
        );

        if (newTweets.length === 0) {
          return { count: 0, references: [] };
        }

        const values = newTweets.map((tweet) => ({
          id: randomUUID(),
          brandSettingsId: input.voiceId,
          type: "twitter_post" as const,
          content: tweet.text,
          metadata: {
            tweetId: tweet.id,
            authorHandle,
            authorName,
            url: `https://x.com/${authorHandle}/status/${tweet.id}`,
            likes: tweet.public_metrics?.like_count ?? 0,
            retweets: tweet.public_metrics?.retweet_count ?? 0,
            replies: tweet.public_metrics?.reply_count ?? 0,
            profileImageUrl,
            createdAt: tweet.created_at ?? new Date().toISOString(),
          },
          note: null,
          applicableTo: ["twitter"] as ApplicablePlatform[],
        }));

        const inserted = await db
          .insert(brandReferences)
          .values(values)
          .returning();

        let syncedCount = 0;

        for (const reference of inserted) {
          let createdDocumentId: string | null = null;

          try {
            const link = await syncBrandReferenceMemory({
              organizationId: input.organizationId,
              voiceId: input.voiceId,
              reference: reference as ReferenceMemoryRecord,
            });
            createdDocumentId = link.documentId;

            await db
              .update(brandReferences)
              .set({
                supermemoryDocumentId: link.documentId,
                supermemoryMemoryId: link.memoryId,
                supermemorySyncedAt: new Date(),
                supermemoryLastSyncError: null,
              })
              .where(eq(brandReferences.id, reference.id));
            syncedCount += 1;
          } catch (error) {
            console.error(
              "Error syncing imported tweet to Supermemory:",
              error
            );

            if (createdDocumentId) {
              try {
                await deleteBrandReferenceMemory({
                  documentId: createdDocumentId,
                });
              } catch (cleanupError) {
                console.error(
                  "Error cleaning up imported Supermemory reference:",
                  cleanupError
                );
              }
            }

            await db
              .update(brandReferences)
              .set({
                supermemoryLastSyncError:
                  error instanceof Error
                    ? error.message
                    : "Supermemory sync failed during import",
              })
              .where(eq(brandReferences.id, reference.id));
          }
        }

        if (autumn && syncedCount > 0) {
          await autumn.track({
            customerId: input.organizationId,
            featureId: FEATURES.REFERENCES,
            value: syncedCount,
          });
        }

        const syncedReferences = await db.query.brandReferences.findMany({
          where: and(
            eq(brandReferences.brandSettingsId, input.voiceId),
            sql`${brandReferences.id} = ANY(ARRAY[${sql.join(
              inserted.map((reference) => sql`${reference.id}`),
              sql`, `
            )}]::text[])`
          ),
        });

        return {
          count: syncedReferences.length,
          references: syncedReferences.map(serializeBrandReference),
        };
      }),
    fetchTweet: baseProcedure
      .input(voiceInputSchema.and(fetchTweetSchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const { success: withinLimit } = await ratelimit.fetchTweet.limit(
          input.organizationId
        );

        if (!withinLimit) {
          throw tooManyRequests("Too many requests. Please try again shortly.");
        }

        await verifyVoiceOwnership(input.organizationId, input.voiceId);

        try {
          return await fetchTweet(input.url);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to fetch tweet";

          throw badRequest(message);
        }
      }),
  },
};
