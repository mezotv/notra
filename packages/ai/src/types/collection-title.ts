export type CollectionTitleNameSource = "generated" | "backfill";

export interface GenerateCollectionTitleParams {
  collectionId: string;
  organizationId: string;
  nameSource?: CollectionTitleNameSource;
  dryRun?: boolean;
}

export interface MaybeGenerateCollectionTitleParams {
  collectionId: string;
  organizationId: string;
}
