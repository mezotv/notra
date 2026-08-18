import { syncGscSuggestions } from "@/lib/geo/search-console";
import type { GscSyncResult } from "@/types/geo";

export async function runGscSyncStep(
  organizationId: string
): Promise<GscSyncResult> {
  "use step";
  return await syncGscSuggestions(organizationId);
}
