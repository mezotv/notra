export interface ContentDetailPageClientProps {
  contentId: string;
  organizationSlug: string;
  organizationId: string;
}

export interface PublishChangelogDialogProps {
  contentId: string;
  onSave: () => Promise<boolean>;
  organizationId: string;
  organizationSlug: string;
  title: string;
}
