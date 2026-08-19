import {
  isTinybirdConfigured,
  queryGeoSequenceResults,
} from "@notra/analytics/tinybird/client";
import { db } from "@notra/db/drizzle";
import { geoPromptSequences } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { geoDb, geoQuery } from "@/lib/geo/effect";
import {
  GeoSequenceCreateFailedError,
  GeoSequenceNotFoundError,
} from "@/lib/geo/errors";
import { toGeoSequence, toNullableNumber } from "@/lib/geo/mappers";
import {
  geoScopeParams,
  requireGeoProject,
  resolveGeoScope,
} from "@/lib/geo/projects";
import type {
  GeoScopeInput,
  GeoSequenceCreateInput,
  GeoSequenceResultsResponse,
  GeoSequencesResponse,
  GeoSequenceUpdateInput,
} from "@/types/geo";

export const listGeoSequences = Effect.fn("geo.sequencesList")(function* (
  input: GeoScopeInput
) {
  const scope = yield* resolveGeoScope(input);
  if (!scope.projectId) {
    const emptyResponse: GeoSequencesResponse = { sequences: [] };
    return emptyResponse;
  }

  const projectId = scope.projectId;
  const rows = yield* geoDb("sequences lookup failed", () =>
    db.query.geoPromptSequences.findMany({
      where: eq(geoPromptSequences.projectId, projectId),
      orderBy: [asc(geoPromptSequences.createdAt)],
    })
  );

  const response: GeoSequencesResponse = {
    sequences: rows.map(toGeoSequence),
  };
  return response;
});

export const createGeoSequence = Effect.fn("geo.sequenceCreate")(function* (
  input: GeoScopeInput,
  sequence: GeoSequenceCreateInput
) {
  const scope = yield* requireGeoProject(input);
  const rows = yield* geoDb("sequence create failed", () =>
    db
      .insert(geoPromptSequences)
      .values({
        id: crypto.randomUUID(),
        organizationId: scope.organizationId,
        projectId: scope.projectId,
        name: sequence.name,
        steps: sequence.steps,
      })
      .returning()
  );

  const row = rows.at(0);
  if (!row) {
    return yield* Effect.fail(new GeoSequenceCreateFailedError({}));
  }

  return toGeoSequence(row);
});

export const updateGeoSequence = Effect.fn("geo.sequenceUpdate")(function* (
  input: GeoScopeInput,
  update: GeoSequenceUpdateInput
) {
  const rows = yield* geoDb("sequence update failed", () =>
    db
      .update(geoPromptSequences)
      .set({
        ...(update.name === undefined ? {} : { name: update.name }),
        ...(update.steps === undefined ? {} : { steps: update.steps }),
        ...(update.enabled === undefined ? {} : { enabled: update.enabled }),
      })
      .where(
        and(
          eq(geoPromptSequences.id, update.sequenceId),
          eq(geoPromptSequences.organizationId, input.organizationId)
        )
      )
      .returning()
  );

  const row = rows.at(0);
  if (!row) {
    return yield* Effect.fail(
      new GeoSequenceNotFoundError({ sequenceId: update.sequenceId })
    );
  }

  return toGeoSequence(row);
});

export const deleteGeoSequence = Effect.fn("geo.sequenceDelete")(function* (
  input: GeoScopeInput,
  sequenceId: string
) {
  const rows = yield* geoDb("sequence delete failed", () =>
    db
      .delete(geoPromptSequences)
      .where(
        and(
          eq(geoPromptSequences.id, sequenceId),
          eq(geoPromptSequences.organizationId, input.organizationId)
        )
      )
      .returning()
  );

  if (!rows.at(0)) {
    return yield* Effect.fail(new GeoSequenceNotFoundError({ sequenceId }));
  }

  return { success: true };
});

export const loadGeoSequenceResults = Effect.fn("geo.sequenceResults")(
  function* (input: GeoScopeInput, sequenceId: string | undefined) {
    const scope = yield* resolveGeoScope(input);
    const result = yield* geoQuery("sequence results query failed", () =>
      queryGeoSequenceResults({
        ...geoScopeParams(scope),
        sequence_id: sequenceId ?? "",
      })
    );

    const response: GeoSequenceResultsResponse = {
      configured: isTinybirdConfigured(),
      results: (result?.data ?? []).map((row) => ({
        sequenceId: row.sequence_id,
        turn: Number(row.turn),
        engine: row.engine,
        prompt: row.prompt,
        mentioned: row.mentioned,
        position: toNullableNumber(row.position),
        sentiment: row.sentiment,
        excerpt: row.excerpt,
        lastCheckedAt: row.last_checked_at,
      })),
    };
    return response;
  }
);
