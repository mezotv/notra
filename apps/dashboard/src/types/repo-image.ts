import type {
  generateRepoImageInputSchema,
  REPO_IMAGE_MODES,
} from "@/schemas/repo-image";

export type RepoImageMode = (typeof REPO_IMAGE_MODES)[number];

export type GenerateRepoImageInput = ReturnType<
  typeof generateRepoImageInputSchema.parse
>;

export interface GenerateRepoImageResult {
  pngBase64: string;
  svg: string;
  html: string;
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
