import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
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
});

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
      .default(false)
      .notNull(),
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

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    markdown: text("markdown").notNull(),
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
    index("posts_org_createdAt_id_idx").on(
      table.organizationId,
      table.createdAt,
      table.id
    ),
  ]
);

export interface PostSourceMetadata {
  triggerId: string;
  triggerSourceType: string;
  repositories: { owner: string; repo: string }[];
  lookbackWindow?: string;
  lookbackRange?: { start: string; end: string };
  eventType?: string;
  eventAction?: string;
  brandVoiceName?: string;
  brandVoiceId?: string;
  selectedCommitShas?: string[];
  selectedPullRequests?: Array<{ repositoryId: string; number: number }>;
  selectedReleases?: Array<{ repositoryId: string; tagName: string }>;
}

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  members: many(members),
  invitations: many(invitations),
  githubIntegrations: many(githubIntegrations),
}));

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
    brandSettings: many(brandSettings),
    notificationSettings: one(organizationNotificationSettings),
    connectedSocialAccounts: many(connectedSocialAccounts),
    posts: many(posts),
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

export const postsRelations = relations(posts, ({ one }) => ({
  organization: one(organizations, {
    fields: [posts.organizationId],
    references: [organizations.id],
  }),
}));
