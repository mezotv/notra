export interface IndexedStoreTool {
  serverIntegrationId: string;
  serverToolName: string;
  title: string | null;
  description: string | null;
}

export interface PublicStoreTool {
  name: string;
  title: string | null;
  description: string | null;
}

export interface StoreListingRow {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  websiteUrl: string | null;
  brandColor: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  bannerUrl: string | null;
  slug: string | null;
  authType: string;
  indexedToolCount: number;
}

export interface PublicStoreIntegration extends StoreListingRow {
  tools: PublicStoreTool[];
}

export interface PublicStoreIntegrationListResponse {
  integrations: PublicStoreIntegration[];
}
