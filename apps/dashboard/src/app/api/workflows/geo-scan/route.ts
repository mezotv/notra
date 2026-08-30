import { deleteQstashMessage, getAppUrl } from "@notra/ai/qstash/triggers";
import { db } from "@notra/db/drizzle";
import { geoSettings } from "@notra/db/schema";
import {
  claimGeoScanRun,
  releaseGeoScanRun,
} from "@notra/geo-core/geo/scan-status";
import { syncGeoScanSchedule } from "@notra/geo-core/geo/schedule";
import { geoOrganizationInputSchema } from "@notra/geo-core/schemas/geo";
import { logGeoScanSkipped } from "@notra/geo-core/utils/geo-log";
import { isDefiniteGeoScanHandoffRejection } from "@notra/geo-core/utils/geo-scan";
import { and, asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { flattenError } from "zod";

import { verifyQstashSignature } from "@/lib/workflows/qstash-verify";
import { startGeoScanRun } from "@/lib/workflows/start";

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

  // Same atomic claim the public API and the dashboard trigger take, so a
  // scheduled scan cannot start alongside a manual one. Reading
  // `isGeoScanRunning` here would let all three pass the check together.
  const claim = await Effect.runPromise(
    Effect.result(claimGeoScanRun(settings.projectId))
  );
  if (claim._tag === "Failure") {
    console.error("[GEO] Failed to claim the scan slot:", claim.failure);
    return new Response("Failed to claim the scan slot", { status: 500 });
  }
  if (!claim.success) {
    await logGeoScanSkipped("already_running", {
      organizationId: settings.organizationId,
      projectId: settings.projectId,
      messageId,
      scanStartedAt: settings.scanStartedAt,
    });
    return Response.json({ status: "skipped", reason: "already_running" });
  }
  const { claimedAt } = claim.success;

  try {
    const { runId } = await startGeoScanRun({
      organizationId: settings.organizationId,
      projectId: settings.projectId,
      // Ownership token for the claim above: the run is the only writer
      // allowed to release or finish it.
      claimedAt: claimedAt.toISOString(),
    });
    return Response.json({ runId }, { status: 202 });
  } catch (error) {
    console.error("[GEO] Failed to start the scheduled scan:", error);
    if (isDefiniteGeoScanHandoffRejection(error)) {
      // Provably nothing was started, so hand the slot straight back instead
      // of blocking the next trigger until the claim goes stale.
      await Effect.runPromise(
        Effect.result(releaseGeoScanRun(settings.projectId, claimedAt))
      );
    } else {
      // Ambiguous outcome — the workflow may have been accepted before the
      // error surfaced. Releasing would let the next trigger run a second,
      // separately billed scan alongside it, so let the claim go stale.
      console.warn(
        "[GEO] Scan hand-off outcome unknown; holding the claim until it goes stale"
      );
    }
    return new Response("Failed to start the scan", { status: 500 });
  }
}
