"use client";

import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { COLLECTION_TABLE_SKELETON_ROWS } from "@/constants/content-collections";

export function CollectionsPageSkeleton() {
  return <GeoTableSkeleton rows={COLLECTION_TABLE_SKELETON_ROWS} />;
}
