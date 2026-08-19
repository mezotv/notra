import { Effect } from "effect";
import { GeoDatabaseError, GeoTinybirdError } from "@/lib/geo/errors";

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

export function geoSkip<A, E>(message: string) {
  return (effect: Effect.Effect<A, E>): Effect.Effect<A | null> =>
    effect.pipe(
      Effect.catch((error) => {
        console.error(`[GEO] ${message}:`, error);
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
