export interface ScheduledContentCreatedEmailItem {
  title: string;
  contentLink: string;
}

export interface ScheduledContentCreatedEmailProps {
  organizationName: string;
  scheduleName: string;
  createdContent: ScheduledContentCreatedEmailItem[];
  contentType: string;
  contentOverviewLink: string;
  organizationSlug: string;
}
