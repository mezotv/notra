import type {
  generateRepoImageInputSchema,
  repoImageModeSchema,
} from "@notra/ai/schemas/repo-image";
import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { z } from "zod";

export type RepoImageMode = z.infer<typeof repoImageModeSchema>;

export type RepoImageErrorCode =
  | "missing_config"
  | "agent_failed"
  | "invalid_source"
  | "not_found";

export type GenerateRepoImageInput = z.infer<
  typeof generateRepoImageInputSchema
>;

export interface GenerateRepoImageResult {
  pngBase64: string;
  svg: string;
  html: string;
  brandIdentityId?: string;
  sandbox: {
    boxId?: string;
    snapshotId?: string;
    snapshotName?: string;
    snapshotSizeBytes?: number;
    snapshotCreatedAt?: string;
  } | null;
  usage?: AgentTokenUsage;
}

export interface ImageToolConfig {
  chatId?: string;
  organizationId: string;
  userId: string;
  useMarkup?: boolean;
}

export interface ImageRevisionToolConfig {
  organizationId: string;
  userId: string;
  postId: string;
  title: string;
  integrationId: string;
  branch: string;
  brandIdentityId?: string;
  useMarkup?: boolean;
}

export interface FontSpec {
  name: string;
  weight: 400 | 500 | 700;
  family: string;
}

export type RepoImageSourceContext =
  | { mode: "prompt"; prompt: string }
  | {
      mode: "pr";
      prNumber: number;
      title: string;
      body: string;
      filesChanged: number;
      additions: number;
      deletions: number;
      topFiles: string[];
    }
  | {
      mode: "commit";
      sha: string;
      shortSha: string;
      message: string;
      filesChanged: number;
      topFiles: string[];
    };
