export interface ChangelogTonePromptInput {
  sourceTargets: string;
  todayUtc: string;
  lookbackLabel: string;
  lookbackStartIso: string;
  lookbackEndIso: string;
  companyName?: string;
  companyDescription?: string;
  audience?: string;
  customInstructions?: string | null;
}
