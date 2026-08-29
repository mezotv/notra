import { deleteQstashMessage, getAppUrl } from "@notra/ai/qstash/triggers";
import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { flattenError } from "zod";

import { logGeoScanSkipped } from "@/lib/geo/log";
import { syncGeoScanSchedule } from "@/lib/geo/schedule";
import { verifyQstashSignature } from "@/lib/workflows/qstash-verify";
import { startGeoScanRun } from "@/lib/workflows/start";
import { geoOrganizationInputSchema } from "@/schemas/geo";
import { isGeoScanRunning } from "@/utils/geo-scan";

const ROUTE_PATH = "/api/workflows/geo-scan";

export async function POST(request: Request) {
  const messageId = request.headers.get("upstash-message-id");
  if (!messageId) {
    return new Response("Missing message id", { status: 400 });
  }

  const rawBody = await request.text();
  const verified = await verifyQstashSignature({
    request,
    rawBody,
    url: `${getAppUrl()}${ROUTE_PATH}`,
  });
  if (!verified) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
  }

  const parsed = geoOrganizationInputSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[GEO] Invalid scan payload:", flattenError(parsed.error));
    return new Response("Invalid payload", { status: 400 });
  }

  const settings = await db.query.geoSettings.findFirst({
    where: parsed.data.projectId
      ? and(
          eq(geoSettings.organizationId, parsed.data.organizationId),
          eq(geoSettings.projectId, parsed.data.projectId)
        )
      : eq(geoSettings.organizationId, parsed.data.organizationId),
    orderBy: [asc(geoSettings.createdAt)],
  });
  if (!settings || !settings.enabled) {
    await logGeoScanSkipped("disabled", {
      organizationId: parsed.data.organizationId,
      projectId: settings?.projectId ?? parsed.data.projectId ?? null,
      messageId,
    });
    return Response.json({ status: "skipped", reason: "disabled" });
  }
  if (settings.qstashMessageId !== messageId) {
    await logGeoScanSkipped("superseded", {
      organizationId: settings.organizationId,
      projectId: settings.projectId,
      messageId,
      scheduledMessageId: settings.qstashMessageId,
    });
    return Response.json({ status: "skipped", reason: "superseded" });
  }

  const qstashMessageId = await syncGeoScanSchedule({
    organizationId: settings.organizationId,
    projectId: settings.projectId,
    enabled: true,
    scanIntervalHours: settings.scanIntervalHours,
    existingMessageId: settings.qstashMessageId,
    reschedule: true,
  });
  if (!qstashMessageId) {
    return new Response("Failed to queue next scan", { status: 500 });
  }
  const claimed = await db
    .update(geoSettings)
    .set({ qstashMessageId })
    .where(
      and(
        eq(geoSettings.id, settings.id),
        eq(geoSettings.qstashMessageId, messageId)
      )
    )
    .returning({ id: geoSettings.id });
  if (claimed.length === 0) {
    try {
      await deleteQstashMessage(qstashMessageId);
    } catch (error) {
      console.warn("[GEO] Failed to cancel superseded next scan:", error);
    }
    await logGeoScanSkipped("superseded", {
      organizationId: settings.organizationId,
      projectId: settings.projectId,
      messageId,
      claimLost: true,
    });
    return Response.json({ status: "skipped", reason: "superseded" });
  }

  if (isGeoScanRunning(settings.scanStartedAt, settings.lastScanAt)) {
    await logGeoScanSkipped("already_running", {
      organizationId: settings.organizationId,
      projectId: settings.projectId,
      messageId,
      scanStartedAt: settings.scanStartedAt,
    });
    return Response.json({ status: "skipped", reason: "already_running" });
  }

  const { runId } = await startGeoScanRun({
    organizationId: settings.organizationId,
    projectId: settings.projectId,
  });
  return Response.json({ runId }, { status: 202 });
}
