import { runGeoWriter } from "@notra/ai/agents/geo-writer";
import type { GeoWriterResult } from "@notra/ai/types/geo-writer";
import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  geoContentBriefs,
  geoSettings,
  projects,
} from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

import {
  GEO_WRITER_TRIGGER_ID,
  GEO_WRITER_TRIGGER_NAME,
} from "@/constants/geo";
import { completeActiveGeneration } from "@/lib/generations/tracking";
import type { GeoWriterContext } from "@/types/geo";

const BLOG_POST_CONTENT_TYPE = "blog_post";

export async function loadGeoWriterContext(input: {
  organizationId: string;
  briefId: string;
  runId: string;
}): Promise<GeoWriterContext | null> {
  "use step";
  const brief = await db.query.geoContentBriefs.findFirst({
    where: and(
      eq(geoContentBriefs.id, input.briefId),
      eq(geoContentBriefs.organizationId, input.organizationId),
      eq(geoContentBriefs.runId, input.runId)
    ),
  });
  if (!(brief?.collectionId && brief.status === "writing")) {
    return null;
  }

  const project = await db.query.projects.findFirst({
    columns: { id: true },
    where: and(
      eq(projects.id, brief.projectId),
      eq(projects.organizationId, input.organizationId)
    ),
  });
  if (!project) {
    return null;
  }

  const [brand, settings] = await Promise.all([
    db.query.brandSettings.findFirst({
      columns: { companyName: true, language: true },
      where: eq(brandSettings.id, brief.brandSettingsId),
    }),
    db.query.geoSettings.findFirst({
      columns: { companyName: true },
      where: eq(geoSettings.projectId, brief.projectId),
    }),
  ]);

  return {
    organizationId: brief.organizationId,
    projectId: brief.projectId,
    briefId: brief.id,
    brandSettingsId: brief.brandSettingsId,
    collectionId: brief.collectionId,
    postId: brief.postId,
    brandName:
      settings?.companyName?.trim() ||
      brand?.companyName?.trim() ||
      "the brand",
    language: brand?.language ?? null,
    topic: brief.topic,
    brief: brief.brief,
  };
}

export async function runGeoWriterStep(
  context: GeoWriterContext,
  runId: string
): Promise<GeoWriterResult> {
  "use step";
  return await runGeoWriter({
    organizationId: context.organizationId,
    projectId: context.projectId,
    brandSettingsId: context.brandSettingsId,
    collectionId: context.collectionId,
    postId: context.postId,
    brief: context.brief,
    topic: context.topic,
    brandName: context.brandName,
    language: context.language,
    sourceMetadata: {
      triggerId: GEO_WRITER_TRIGGER_ID,
      triggerSourceType: "geo",
      prompt: context.brief.targetPrompt,
      brandVoiceId: context.brandSettingsId,
      briefId: context.briefId,
      projectId: context.projectId,
    },
    telemetryMetadata: {
      organizationId: context.organizationId,
      projectId: context.projectId,
      briefId: context.briefId,
      runId,
    },
  });
}

export async function finishGeoWriter(input: {
  organizationId: string;
  briefId: string;
  runId: string;
  postId: string;
  title: string;
  humanized: boolean;
}): Promise<void> {
  "use step";
  await db
    .update(geoContentBriefs)
    .set({
      status: "completed",
      postId: input.postId,
      humanized: input.humanized,
      error: null,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(geoContentBriefs.organizationId, input.organizationId),
        eq(geoContentBriefs.id, input.briefId),
        eq(geoContentBriefs.runId, input.runId),
        eq(geoContentBriefs.status, "writing")
      )
    );

  await completeActiveGeneration(input.organizationId, {
    runId: input.runId,
    triggerId: GEO_WRITER_TRIGGER_ID,
    outputType: BLOG_POST_CONTENT_TYPE,
    triggerName: GEO_WRITER_TRIGGER_NAME,
    status: "success",
    title: input.title,
    completedAt: new Date().toISOString(),
    source: "dashboard",
  });
}

export async function failGeoWriter(input: {
  organizationId: string;
  briefId: string;
  runId: string;
  reason: string;
}): Promise<void> {
  "use step";
  await db
    .update(geoContentBriefs)
    .set({ status: "failed", error: input.reason, completedAt: new Date() })
    .where(
      and(
        eq(geoContentBriefs.organizationId, input.organizationId),
        eq(geoContentBriefs.id, input.briefId),
        eq(geoContentBriefs.runId, input.runId),
        eq(geoContentBriefs.status, "writing")
      )
    );

  await completeActiveGeneration(input.organizationId, {
    runId: input.runId,
    triggerId: GEO_WRITER_TRIGGER_ID,
    outputType: BLOG_POST_CONTENT_TYPE,
    triggerName: GEO_WRITER_TRIGGER_NAME,
    status: "failed",
    reason: input.reason,
    completedAt: new Date().toISOString(),
    source: "dashboard",
  });
}
