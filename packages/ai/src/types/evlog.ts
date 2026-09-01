import type { DrainContext } from "evlog";

export type GeoLogEventName = `geo.${string}`;

export interface GeoLogEvent extends Record<string, unknown> {
  event: GeoLogEventName;
}

export interface GeoLogger {
  info(event: GeoLogEvent): void;
  warn(event: GeoLogEvent): void;
  error(event: GeoLogEvent): void;
}

export type EvlogDrain = (ctx: DrainContext) => void | Promise<void>;
