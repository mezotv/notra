import { Effect } from "effect";

import { GeoDatabaseError, GeoTinybirdError } from "@/lib/geo/errors";
import { logGeoSkip } from "@/lib/geo/log";
import type { GeoSkipFields } from "@/types/geo";

export function geoQuery<A>(
  label: string,
  run: () => Promise<A>
): Effect.Effect<A | null> {
  return Effect.tryPromise({
    try: run,
    catch: (cause) => new GeoTinybirdError({ label, cause }),
  }).pipe(
    Effect.catch((error) => {
      console.error(`[GEO] ${error.label}:`, error.cause);
      return Effect.succeed(null);
    })
  );
}

export function geoSkip<A, E>(message: string, fields?: GeoSkipFields) {
  return (effect: Effect.Effect<A, E>): Effect.Effect<A | null> =>
    effect.pipe(
      Effect.catch((error) => {
        logGeoSkip(message, fields, error);
        return Effect.succeed(null);
      })
    );
}

export function geoDb<A>(
  label: string,
  run: () => Promise<A>
): Effect.Effect<A, GeoDatabaseError> {
  return Effect.tryPromise({
    try: run,
    catch: (cause) => new GeoDatabaseError({ label, cause }),
  });
}
