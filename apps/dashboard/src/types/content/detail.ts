import type { GitHubPublishContentType } from "@/types/integrations/github";

export interface ContentDetailPageClientProps {
  contentId: string;
  organizationSlug: string;
  organizationId: string;
}

export interface PublishContentToGitHubDialogProps {
  contentId: string;
  contentType: GitHubPublishContentType;
  onSave: () => Promise<boolean>;
  organizationId: string;
  organizationSlug: string;
  title: string;
}
