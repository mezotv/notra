import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const lookbackWindowEnum = pgEnum("lookback_window", [
  "current_day",
  "yesterday",
  "last_7_days",
  "last_14_days",
  "last_30_days",
]);

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const postCollectionSourceEnum = pgEnum("post_collection_source", [
  "manual",
  "chat",
  "schedule",
  "automation",
  "api",
  "backfill",
]);

export const postCollectionNameSourceEnum = pgEnum(
  "post_collection_name_source",
  ["generated", "user", "backfill"]
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  hidePersonalData: boolean("hide_personal_data").default(false).notNull(),
  showAgentStats: boolean("show_agent_stats").default(false).notNull(),
});

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
    pinnedAt: timestamp("pinned_at"),
    deletedAt: timestamp("deleted_at"),
    externalChannelSource: text("external_channel_source"),
    externalChannelId: text("external_channel_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("chatSessions_organizationId_idx").on(table.organizationId),
    index("chatSessions_organizationId_deletedAt_idx").on(
      table.organizationId,
      table.deletedAt
    ),
    uniqueIndex("chatSessions_org_externalChannel_uidx")
      .on(
        table.organizationId,
        table.externalChannelSource,
        table.externalChannelId
      )
      .where(
        sql`${table.externalChannelSource} IN ('discord', 'slack') AND ${table.externalChannelId} IS NOT NULL AND ${table.deletedAt} IS NULL`
      ),
  ]
);

export const chatAttachments = pgTable(
  "chat_attachments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    filename: text("filename").notNull(),
    mediaType: text("media_type").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chatAttachments_organizationId_createdAt_idx").on(
      table.organizationId,
      table.createdAt
    ),
    index("chatAttachments_userId_idx").on(table.userId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)]
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)]
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)]
);

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
    onboardingCompleted: boolean("onboarding_completed")
      .default(false)
      .notNull(),
    onboardingDismissed: boolean("onboarding_dismissed")
      .default(false)
      .notNull(),
  },
  (table) => [uniqueIndex("organizations_slug_uidx").on(table.slug)]
);

export const members = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("members_organizationId_idx").on(table.organizationId),
    index("members_userId_idx").on(table.userId),
  ]
);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitations_organizationId_idx").on(table.organizationId),
    index("invitations_email_idx").on(table.email),
  ]
);

export const githubIntegrations = pgTable(
  "github_integrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    encryptedToken: text("encrypted_token"),
    owner: text("owner"),
    repo: text("repo"),
    defaultBranch: text("default_branch"),
    repositoryEnabled: boolean("repository_enabled").default(true).notNull(),
    encryptedWebhookSecret: text("encrypted_webhook_secret"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("githubIntegrations_organizationId_idx").on(table.organizationId),
    index("githubIntegrations_createdByUserId_idx").on(table.createdByUserId),
    uniqueIndex("githubIntegrations_organization_owner_repo_uidx").on(
      table.organizationId,
      table.owner,
      table.repo
    ),
  ]
);

export const linearIntegrations = pgTable(
  "linear_integrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    encryptedAccessToken: text("encrypted_access_token"),
    linearOrganizationId: text("linear_organization_id").notNull(),
    linearOrganizationName: text("linear_organization_name"),
    linearTeamId: text("linear_team_id"),
    linearTeamName: text("linear_team_name"),
    encryptedWebhookSecret: text("encrypted_webhook_secret"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("linearIntegrations_organizationId_idx").on(table.organizationId),
    index("linearIntegrations_createdByUserId_idx").on(table.createdByUserId),
    uniqueIndex("linearIntegrations_org_linearOrg_team_uidx").on(
      table.organizationId,
      table.linearOrganizationId,
      table.linearTeamId
    ),
    uniqueIndex("linearIntegrations_org_linearOrg_no_team_uidx")
      .on(table.organizationId, table.linearOrganizationId)
      .where(sql`${table.linearTeamId} IS NULL`),
  ]
);

export const mcpServerIntegrations = pgTable(
  "mcp_server_integrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    encryptedHeaders: jsonb("encrypted_headers")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    lastToolSyncAt: timestamp("last_tool_sync_at"),
    toolSyncStatus: text("tool_sync_status").default("idle").notNull(),
    toolSyncError: text("tool_sync_error"),
    indexedToolCount: integer("indexed_tool_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("mcpServerIntegrations_organizationId_idx").on(table.organizationId),
    index("mcpServerIntegrations_createdByUserId_idx").on(
      table.createdByUserId
    ),
    uniqueIndex("mcpServerIntegrations_org_id_uidx").on(
      table.organizationId,
      table.id
    ),
    uniqueIndex("mcpServerIntegrations_org_name_uidx").on(
      table.organizationId,
      table.name
    ),
  ]
);

export const mcpToolIndex = pgTable(
  "mcp_tool_index",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    serverIntegrationId: text("server_integration_id")
      .notNull()
      .references(() => mcpServerIntegrations.id, { onDelete: "cascade" }),
    serverToolName: text("server_tool_name").notNull(),
    runtimeToolName: text("runtime_tool_name").notNull(),
    title: text("title"),
    description: text("description"),
    inputSchema: jsonb("input_schema").notNull(),
    outputSchema: jsonb("output_schema"),
    annotations: jsonb("annotations"),
    meta: jsonb("meta"),
    schemaHash: text("schema_hash").notNull(),
    searchText: text("search_text").notNull(),
    status: text("status").default("active").notNull(),
    lastSeenAt: timestamp("last_seen_at"),
    lastIndexedAt: timestamp("last_indexed_at").defaultNow().notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("mcpToolIndex_server_tool_uidx").on(
      table.serverIntegrationId,
      table.serverToolName
    ),
    uniqueIndex("mcpToolIndex_org_id_uidx").on(table.organizationId, table.id),
    uniqueIndex("mcpToolIndex_org_runtime_tool_uidx").on(
      table.organizationId,
      table.runtimeToolName
    ),
    index("mcpToolIndex_organizationId_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("mcpToolIndex_serverIntegrationId_status_idx").on(
      table.serverIntegrationId,
      table.status
    ),
    index("mcpToolIndex_searchText_gin_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.searchText})`
    ),
    foreignKey({
      columns: [table.organizationId, table.serverIntegrationId],
      foreignColumns: [
        mcpServerIntegrations.organizationId,
        mcpServerIntegrations.id,
      ],
      name: "mcpToolIndex_org_server_fk",
    }).onDelete("cascade"),
  ]
);

export const mcpSessionToolActivations = pgTable(
  "mcp_session_tool_activations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    surface: text("surface").notNull(),
    mcpToolIndexId: text("mcp_tool_index_id")
      .notNull()
      .references(() => mcpToolIndex.id, { onDelete: "cascade" }),
    runtimeToolName: text("runtime_tool_name").notNull(),
    sourceQuery: text("source_query"),
    activatedAt: timestamp("activated_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    uniqueIndex("mcpSessionToolActivations_session_tool_uidx").on(
      table.organizationId,
      table.sessionId,
      table.surface,
      table.mcpToolIndexId
    ),
    index("mcpSessionToolActivations_session_idx").on(
      table.organizationId,
      table.sessionId,
      table.surface
    ),
    index("mcpSessionToolActivations_expiresAt_idx").on(table.expiresAt),
    foreignKey({
      columns: [table.organizationId, table.mcpToolIndexId],
      foreignColumns: [mcpToolIndex.organizationId, mcpToolIndex.id],
      name: "mcpSessionToolActivations_org_tool_fk",
    }).onDelete("cascade"),
  ]
);

export const contentTriggers = pgTable(
  "content_triggers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Untitled Schedule"),
    sourceType: text("source_type").notNull(),
    sourceConfig: jsonb("source_config").notNull(),
    targets: jsonb("targets").notNull(),
    outputType: text("output_type").notNull(),
    outputConfig: jsonb("output_config"),
    dedupeHash: text("dedupe_hash").notNull(),
    qstashScheduleId: text("qstash_schedule_id"),
    enabled: boolean("enabled").default(true).notNull(),
    autoPublish: boolean("auto_publish").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("contentTriggers_organizationId_idx").on(table.organizationId),
    uniqueIndex("contentTriggers_organization_dedupe_uidx").on(
      table.organizationId,
      table.dedupeHash
    ),
  ]
);

export const contentTriggerLookbackWindows = pgTable(
  "content_trigger_lookback_windows",
  {
    triggerId: text("trigger_id")
      .primaryKey()
      .references(() => contentTriggers.id, { onDelete: "cascade" }),
    window: lookbackWindowEnum("window").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const repositoryOutputs = pgTable(
  "repository_outputs",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => githubIntegrations.id, { onDelete: "cascade" }),
    outputType: text("output_type").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    config: jsonb("config"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("repositoryOutputs_repositoryId_idx").on(table.repositoryId),
    uniqueIndex("repositoryOutputs_repository_outputType_uidx").on(
      table.repositoryId,
      table.outputType
    ),
  ]
);

export const brandSettings = pgTable(
  "brand_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Default"),
    isDefault: boolean("is_default").notNull().default(true),
    websiteUrl: text("website_url").notNull(),
    companyName: text("company_name"),
    companyDescription: text("company_description"),
    toneProfile: text("tone_profile"),
    customTone: text("custom_tone"),
    customInstructions: text("custom_instructions"),
    audience: text("audience"),
    language: text("language").default("English"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("brandSettings_org_name_uidx").on(
      table.organizationId,
      table.name
    ),
    uniqueIndex("brandSettings_org_default_uidx")
      .on(table.organizationId)
      .where(sql`${table.isDefault} = true`),
    index("brandSettings_organizationId_idx").on(table.organizationId),
  ]
);

export const referenceTypeEnum = pgEnum("reference_type", [
  "twitter_post",
  "linkedin_post",
  "blog_post",
  "custom",
]);

export const applicablePlatformEnum = pgEnum("applicable_platform", [
  "all",
  "twitter",
  "linkedin",
  "blog",
]);

export const brandReferences = pgTable(
  "brand_references",
  {
    id: text("id").primaryKey(),
    brandSettingsId: text("brand_settings_id")
      .notNull()
      .references(() => brandSettings.id, { onDelete: "cascade" }),
    type: referenceTypeEnum("type").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    note: text("note"),
    supermemoryDocumentId: text("supermemory_document_id"),
    supermemoryMemoryId: text("supermemory_memory_id"),
    supermemorySyncedAt: timestamp("supermemory_synced_at"),
    supermemoryLastSyncError: text("supermemory_last_sync_error"),
    applicableTo: applicablePlatformEnum("applicable_to")
      .array()
      .default(sql`ARRAY['all']::applicable_platform[]`)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("brandReferences_brandSettingsId_idx").on(table.brandSettingsId),
  ]
);

export const connectedSocialAccounts = pgTable(
  "connected_social_accounts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    profileImageUrl: text("profile_image_url"),
    verified: boolean("verified").default(false).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    scope: text("scope"),
    tokenExpiresAt: timestamp("token_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("connectedSocialAccounts_organizationId_idx").on(
      table.organizationId
    ),
    uniqueIndex("connectedSocialAccounts_org_provider_account_uidx").on(
      table.organizationId,
      table.provider,
      table.providerAccountId
    ),
  ]
);

export const organizationNotificationSettings = pgTable(
  "organization_notification_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    scheduledContentCreation: boolean("scheduled_content_creation")
      .default(false)
      .notNull(),
    scheduledContentFailed: boolean("scheduled_content_failed")
      .default(true)
      .notNull(),
    scheduledContentSkipped: boolean("scheduled_content_skipped")
      .default(false)
      .notNull(),
    marketingEmails: boolean("marketing_emails").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("orgNotificationSettings_organizationId_uidx").on(
      table.organizationId
    ),
  ]
);

export const postCollections = pgTable(
  "post_collections",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    source: postCollectionSourceEnum("source").notNull(),
    sourceId: text("source_id"),
    name: text("name").notNull(),
    nameSource: postCollectionNameSourceEnum("name_source")
      .default("generated")
      .notNull(),
    contentTypes: jsonb("content_types").default(sql`'[]'::jsonb`).notNull(),
    sourceMetadata: jsonb("source_metadata"),
    expectedPostCount: integer("expected_post_count"),
    completedPostCount: integer("completed_post_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("post_collections_org_created_at_idx").on(
      table.organizationId,
      table.createdAt,
      table.id
    ),
    index("post_collections_source_idx").on(
      table.organizationId,
      table.source,
      table.sourceId
    ),
    uniqueIndex("post_collections_chat_source_uidx")
      .on(table.organizationId, table.source, table.sourceId)
      .where(sql`${table.source} = 'chat' AND ${table.sourceId} IS NOT NULL`),
  ]
);

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => postCollections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug"),
    content: text("content").notNull(),
    markdown: text("markdown"),
    rawHtml: text("raw_html"),
    recommendations: text("recommendations"),
    contentType: text("content_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    sourceMetadata: jsonb("source_metadata"),
    status: postStatusEnum("status").default("draft").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("posts_org_slug_uidx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.slug} IS NOT NULL`),
    index("posts_org_createdAt_id_idx").on(
      table.organizationId,
      table.createdAt,
      table.id
    ),
    index("posts_collection_id_idx").on(table.collectionId),
  ]
);

export const skills = pgTable(
  "skills",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("skills_organizationId_idx").on(table.organizationId),
    uniqueIndex("skills_org_name_uidx").on(table.organizationId, table.name),
  ]
);

export interface PostSourceMetadata {
  triggerId?: string;
  triggerSourceType?: string;
  repositories?: { owner: string; repo: string }[];
  linearIntegrations?: Array<{ integrationId: string }>;
  lookbackWindow?: string;
  lookbackRange?: { start: string; end: string };
  eventType?: string;
  eventAction?: string;
  brandVoiceName?: string;
  brandVoiceId?: string;
  selectedCommitShas?: string[];
  selectedPullRequests?: Array<{ repositoryId: string; number: number }>;
  selectedReleases?: Array<{ repositoryId: string; tagName: string }>;
  selectedLinearIssues?: Array<{ integrationId: string; issueId: string }>;
  type?: "generated_image";
  chatId?: string | null;
  integrationId?: string;
  branch?: string;
  mode?: string;
  prompt?: string | null;
  prNumber?: number | null;
  commitSha?: string | null;
  sourcePostId?: string | null;
  sandbox?: {
    boxId?: string;
    snapshotId?: string;
    snapshotName?: string;
    snapshotSizeBytes?: number;
    snapshotCreatedAt?: string;
  } | null;
  usage?: unknown;
  artifacts?: {
    html?: string;
    svg?: string;
  };
}

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  members: many(members),
  invitations: many(invitations),
  githubIntegrations: many(githubIntegrations),
  linearIntegrations: many(linearIntegrations),
  mcpServerIntegrations: many(mcpServerIntegrations),
  chatAttachments: many(chatAttachments),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one }) => ({
  organization: one(organizations, {
    fields: [chatSessions.organizationId],
    references: [organizations.id],
  }),
}));

export const chatAttachmentsRelations = relations(
  chatAttachments,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [chatAttachments.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [chatAttachments.userId],
      references: [users.id],
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(
  organizations,
  ({ many, one }) => ({
    members: many(members),
    invitations: many(invitations),
    githubIntegrations: many(githubIntegrations),
    linearIntegrations: many(linearIntegrations),
    mcpServerIntegrations: many(mcpServerIntegrations),
    mcpToolIndex: many(mcpToolIndex),
    mcpSessionToolActivations: many(mcpSessionToolActivations),
    brandSettings: many(brandSettings),
    notificationSettings: one(organizationNotificationSettings),
    connectedSocialAccounts: many(connectedSocialAccounts),
    postCollections: many(postCollections),
    posts: many(posts),
    skills: many(skills),
    chatSessions: many(chatSessions),
    chatAttachments: many(chatAttachments),
  })
);

export const membersRelations = relations(members, ({ one }) => ({
  organizations: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  users: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organizations: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  users: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

export const githubIntegrationsRelations = relations(
  githubIntegrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [githubIntegrations.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [githubIntegrations.createdByUserId],
      references: [users.id],
    }),
    outputs: many(repositoryOutputs),
  })
);

export const linearIntegrationsRelations = relations(
  linearIntegrations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [linearIntegrations.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [linearIntegrations.createdByUserId],
      references: [users.id],
    }),
  })
);

export const mcpServerIntegrationsRelations = relations(
  mcpServerIntegrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [mcpServerIntegrations.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [mcpServerIntegrations.createdByUserId],
      references: [users.id],
    }),
    tools: many(mcpToolIndex),
  })
);

export const mcpToolIndexRelations = relations(
  mcpToolIndex,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [mcpToolIndex.organizationId],
      references: [organizations.id],
    }),
    serverIntegration: one(mcpServerIntegrations, {
      fields: [mcpToolIndex.serverIntegrationId],
      references: [mcpServerIntegrations.id],
    }),
    activations: many(mcpSessionToolActivations),
  })
);

export const mcpSessionToolActivationsRelations = relations(
  mcpSessionToolActivations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [mcpSessionToolActivations.organizationId],
      references: [organizations.id],
    }),
    tool: one(mcpToolIndex, {
      fields: [mcpSessionToolActivations.mcpToolIndexId],
      references: [mcpToolIndex.id],
    }),
  })
);

export const contentTriggersRelations = relations(
  contentTriggers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [contentTriggers.organizationId],
      references: [organizations.id],
    }),
    lookbackWindow: one(contentTriggerLookbackWindows, {
      fields: [contentTriggers.id],
      references: [contentTriggerLookbackWindows.triggerId],
    }),
  })
);

export const contentTriggerLookbackWindowsRelations = relations(
  contentTriggerLookbackWindows,
  ({ one }) => ({
    trigger: one(contentTriggers, {
      fields: [contentTriggerLookbackWindows.triggerId],
      references: [contentTriggers.id],
    }),
  })
);

export const repositoryOutputsRelations = relations(
  repositoryOutputs,
  ({ one }) => ({
    integration: one(githubIntegrations, {
      fields: [repositoryOutputs.repositoryId],
      references: [githubIntegrations.id],
    }),
  })
);

export const brandSettingsRelations = relations(
  brandSettings,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [brandSettings.organizationId],
      references: [organizations.id],
    }),
    references: many(brandReferences),
  })
);

export const brandReferencesRelations = relations(
  brandReferences,
  ({ one }) => ({
    brandSettings: one(brandSettings, {
      fields: [brandReferences.brandSettingsId],
      references: [brandSettings.id],
    }),
  })
);

export const connectedSocialAccountsRelations = relations(
  connectedSocialAccounts,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [connectedSocialAccounts.organizationId],
      references: [organizations.id],
    }),
  })
);

export const organizationNotificationSettingsRelations = relations(
  organizationNotificationSettings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationNotificationSettings.organizationId],
      references: [organizations.id],
    }),
  })
);

export const postCollectionsRelations = relations(
  postCollections,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [postCollections.organizationId],
      references: [organizations.id],
    }),
    posts: many(posts),
  })
);

export const postsRelations = relations(posts, ({ one }) => ({
  organization: one(organizations, {
    fields: [posts.organizationId],
    references: [organizations.id],
  }),
  collection: one(postCollections, {
    fields: [posts.collectionId],
    references: [postCollections.id],
  }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  organization: one(organizations, {
    fields: [skills.organizationId],
    references: [organizations.id],
  }),
}));
