import { NextResponse } from "next/server";
import type { GeoIngestError } from "@/lib/geo-ingest/errors";

const NO_STORE = { "Cache-Control": "no-store" };

const HTTP_UNAUTHORIZED = 401;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_BAD_GATEWAY = 502;
const HTTP_ACCEPTED = 202;

export function toGeoIngestAcceptedResponse(): NextResponse {
  return NextResponse.json(
    { ok: true },
    { status: HTTP_ACCEPTED, headers: NO_STORE }
  );
}

export function toGeoIngestErrorResponse(
  failure: GeoIngestError
): NextResponse {
  switch (failure._tag) {
    case "GeoIngestMissingToken":
    case "GeoIngestInvalidToken":
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: HTTP_UNAUTHORIZED, headers: NO_STORE }
      );
    case "GeoIngestRateLimited":
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: HTTP_TOO_MANY_REQUESTS, headers: NO_STORE }
      );
    case "GeoIngestInvalidPayload":
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: HTTP_BAD_REQUEST, headers: NO_STORE }
      );
    case "GeoIngestUnparseableUrl":
      return NextResponse.json(
        { error: "Invalid url" },
        { status: HTTP_BAD_REQUEST, headers: NO_STORE }
      );
    default:
      console.error("[GEO] ingest failed:", failure.cause);
      return NextResponse.json(
        { error: "Ingest failed" },
        { status: HTTP_BAD_GATEWAY, headers: NO_STORE }
      );
  }
}
