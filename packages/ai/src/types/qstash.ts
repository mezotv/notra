export interface CreateQstashRouteScheduleProps {
  path: string;
  cron: string;
  body: Record<string, unknown>;
  scheduleId?: string;
}

export interface PublishQstashRouteProps {
  path: string;
  body: Record<string, unknown>;
  delaySeconds: number;
}
