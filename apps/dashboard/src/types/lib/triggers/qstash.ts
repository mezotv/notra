export type WorkflowDelay =
  | number
  | `${bigint}s`
  | `${bigint}m`
  | `${bigint}h`
  | `${bigint}d`;

export interface CreateQstashScheduleProps {
  triggerId: string;
  cron: string;
  scheduleId?: string;
}
