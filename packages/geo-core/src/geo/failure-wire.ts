import type { GeoRouterError } from "./errors";

/**
 * A GEO domain failure, reduced to what a status mapper actually reads.
 *
 * Some GEO programs can only run inside the dashboard (AI calls, `"use step"`
 * billing gates), so the public API reaches them over an internal HTTP route.
 * Sending the tag across the wire lets `apps/api` map the failure with the very
 * same switch it uses for programs it runs in-process, instead of the dashboard
 * picking a status and the two surfaces drifting apart.
 *
 * `cause` is deliberately dropped: it carries driver and provider internals
 * that must not leave the dashboard process.
 */
export interface GeoFailureWire {
  readonly _tag: string;
  readonly message?: string;
  readonly limit?: number;
  readonly status?: string;
}

function readString(source: object, key: string): string | undefined {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(source: object, key: string): number | undefined {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

export function toGeoFailureWire(error: GeoRouterError): GeoFailureWire {
  return {
    _tag: error._tag,
    message: readString(error, "message"),
    limit: readNumber(error, "limit"),
    status: readString(error, "status"),
  };
}
