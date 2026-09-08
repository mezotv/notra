import type {
  createSkillRequestSchema,
  patchSkillRequestSchema,
} from "@notra/schemas/api/skills";
import type { z } from "zod";

import type {
  SkillDuplicateError,
  SkillNotFoundError,
  SystemSkillDeleteError,
  SystemSkillRenameError,
} from "../errors/skills";
import type { GeoRequestContext } from "./geo-context";

export type SkillDomainError =
  | SkillDuplicateError
  | SkillNotFoundError
  | SystemSkillDeleteError
  | SystemSkillRenameError;

type SkillsDatabase = GeoRequestContext["db"];

export interface SkillProgramInput {
  db: SkillsDatabase;
  organizationId: string;
}

export interface NamedSkillProgramInput extends SkillProgramInput {
  name: string;
}

export interface CreateSkillProgramInput extends SkillProgramInput {
  body: z.infer<typeof createSkillRequestSchema>;
}

export interface PatchSkillProgramInput extends NamedSkillProgramInput {
  body: z.infer<typeof patchSkillRequestSchema>;
}

export interface SkillTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillUpdatedAt {
  updatedAt: Date;
}

export type SerializedSkill<T extends SkillTimestamps> = Omit<
  T,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedSkillSummary<T extends SkillUpdatedAt> = Omit<
  T,
  "updatedAt"
> & {
  updatedAt: string;
};
