/**
 * Moved to `@notra/geo-core/geo/ingest` so the public API can issue the same
 * tracking tokens. Re-exported here to keep existing import paths.
 */
export {
  buildGeoIngestToken,
  getGeoIngestSecret,
  isGeoIngestConfigured,
  verifyGeoIngestToken,
} from "@notra/geo-core/geo/ingest";
