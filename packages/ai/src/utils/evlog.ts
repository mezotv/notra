import { GEO_LOG_EVENT_PREFIX } from "@notra/ai/constants/evlog";
import type { WideEvent } from "evlog";

export function isGeoLogEvent(event: WideEvent): boolean {
  return (
    typeof event.event === "string" &&
    event.event.startsWith(GEO_LOG_EVENT_PREFIX)
  );
}
