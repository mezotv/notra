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
