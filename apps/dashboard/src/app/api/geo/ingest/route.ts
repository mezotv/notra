import { Effect } from "effect";
import type { NextRequest, NextResponse } from "next/server";
import { runGeoIngest } from "@/lib/geo-ingest/pipeline";
import {
  toGeoIngestAcceptedResponse,
  toGeoIngestErrorResponse,
} from "@/lib/geo-ingest/response";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const outcome = await Effect.runPromise(Effect.result(runGeoIngest(request)));

  if (outcome._tag === "Failure") {
    return toGeoIngestErrorResponse(outcome.failure);
  }

  return toGeoIngestAcceptedResponse();
}
