export interface PurgeSocialAccountInput {
  organizationId: string;
  provider: string;
  providerAccountId: string;
}

export interface PurgeGeoProjectInput {
  organizationId: string;
  projectId: string;
}
