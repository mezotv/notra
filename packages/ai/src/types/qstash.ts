export interface CreateQstashRouteScheduleProps {
  path: string;
  cron: string;
  body: Record<string, unknown>;
  scheduleId?: string;
}
