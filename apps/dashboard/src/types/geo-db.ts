import type { QueryClient } from "@tanstack/react-query";
import type { GeoScopeInput } from "@/types/geo";

export interface GeoCollectionSpec<T extends object> {
  name: string;
  errorMessage: string;
  fetch: (scope: GeoScopeInput) => Promise<T[]>;
  getKey: (item: T) => string;
  insert?: (scope: GeoScopeInput, item: T) => Promise<unknown>;
  update?: (
    scope: GeoScopeInput,
    key: string,
    modified: T,
    original: T
  ) => Promise<unknown>;
  remove?: (scope: GeoScopeInput, original: T) => Promise<unknown>;
  invalidateLegacy: (
    queryClient: QueryClient,
    scope: GeoScopeInput
  ) => Promise<unknown>;
}
