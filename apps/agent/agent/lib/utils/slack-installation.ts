import { AsyncLocalStorage } from "node:async_hooks";

import {
  getEnabledSlackIntegrations,
  getSlackIntegrationBotToken,
  getSlackIntegrationByTeamId,
} from "@notra/ai/integrations/slack-workspace";
import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";

import {
  INSTALLATION_CACHE_MAX_ENTRIES,
  INSTALLATION_CACHE_TTL_MS,
} from "../constants/slack-installation";
import type {
  InstallationCacheEntry,
  ResolvedSlackInstallation,
} from "../types/slack";

const installationStorage = new AsyncLocalStorage<ResolvedSlackInstallation>();

const installationCache = new Map<string, InstallationCacheEntry>();

async function getOrganizationSlug(
  organizationId: string
): Promise<string | null> {
  const rows = await db
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  return rows[0]?.slug ?? null;
}

function getEnvInstallation(teamId: string): ResolvedSlackInstallation | null {
  const envTeamId = process.env.SLACK_AGENT_TEAM_ID?.trim();
  const organizationId = process.env.SLACK_AGENT_ORGANIZATION_ID?.trim();
  const botToken = process.env.SLACK_AGENT_BOT_TOKEN?.trim();
  if (!(envTeamId && organizationId && botToken) || envTeamId !== teamId) {
    return null;
  }

  const allowed =
    process.env.SLACK_AGENT_ALLOWED_CHANNEL_IDS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return {
    organizationId,
    organizationSlug: null,
    teamId,
    botToken,
    allowedChannelIds: allowed.length > 0 ? allowed : null,
  };
}

async function loadInstallation(
  teamId: string
): Promise<ResolvedSlackInstallation | null> {
  const integration = await getSlackIntegrationByTeamId(teamId);
  if (integration) {
    if (!integration.enabled) {
      return null;
    }
    return {
      organizationId: integration.organizationId,
      organizationSlug: await getOrganizationSlug(integration.organizationId),
      teamId: integration.slackTeamId,
      botToken: getSlackIntegrationBotToken(integration),
      allowedChannelIds:
        integration.allowedChannelIds &&
        integration.allowedChannelIds.length > 0
          ? integration.allowedChannelIds
          : null,
    };
  }

  const envInstallation = getEnvInstallation(teamId);
  if (!envInstallation) {
    return null;
  }
  return {
    ...envInstallation,
    organizationSlug: await getOrganizationSlug(envInstallation.organizationId),
  };
}

export async function resolveSlackInstallation(
  teamId: string
): Promise<ResolvedSlackInstallation | null> {
  const cached = installationCache.get(teamId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.installation;
  }

  const installation = await loadInstallation(teamId);
  if (installationCache.size >= INSTALLATION_CACHE_MAX_ENTRIES) {
    const oldestKey = installationCache.keys().next().value;
    if (oldestKey !== undefined) {
      installationCache.delete(oldestKey);
    }
  }
  installationCache.set(teamId, {
    expiresAt: now + INSTALLATION_CACHE_TTL_MS,
    installation,
  });
  return installation;
}

export function evictSlackInstallation(teamId: string): void {
  installationCache.delete(teamId);
}

export function isChannelAllowed(
  installation: ResolvedSlackInstallation,
  channelId: string
): boolean {
  return (
    installation.allowedChannelIds === null ||
    installation.allowedChannelIds.includes(channelId)
  );
}

export function runWithSlackInstallation<T>(
  installation: ResolvedSlackInstallation | null,
  run: () => T
): T {
  if (!installation) {
    return run();
  }
  return installationStorage.run(installation, run);
}

export async function runWithSlackTeam<T>(
  teamId: string | null | undefined,
  run: () => Promise<T>
): Promise<T> {
  const installation = teamId ? await resolveSlackInstallation(teamId) : null;
  return runWithSlackInstallation(installation, run);
}

export async function resolveSlackOutboundBotToken(): Promise<string> {
  const current = installationStorage.getStore();
  if (current) {
    return current.botToken;
  }

  const enabled = await getEnabledSlackIntegrations();
  if (enabled.length === 1 && enabled[0]) {
    return getSlackIntegrationBotToken(enabled[0]);
  }

  const envToken = process.env.SLACK_AGENT_BOT_TOKEN?.trim();
  if (envToken) {
    return envToken;
  }

  throw new Error(
    "No Slack installation available to resolve an outbound bot token"
  );
}
