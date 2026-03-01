export interface ContentPublishingMetricsData {
  drafts: number;
  published: number;
  graph: {
    activity: Array<{
      date: string;
      count: number;
      level: number;
      drafts: number;
      published: number;
    }>;
  };
}
