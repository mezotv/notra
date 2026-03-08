export interface ActiveGeneration {
  runId: string;
  triggerId: string;
  outputType: string;
  triggerName: string;
  startedAt: string;
}

export interface GenerationResult {
  runId: string;
  triggerId: string;
  outputType: string;
  triggerName: string;
  status: "success" | "failed";
  title?: string;
  reason?: string;
  completedAt: string;
}
