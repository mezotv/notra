export type ApplicablePlatform = "all" | "twitter" | "linkedin" | "blog";

export interface BrandReference {
  id: string;
  brandSettingsId: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  note: string | null;
  applicableTo: ApplicablePlatform[];
  createdAt: string;
  updatedAt: string;
}

export interface TweetMetadata {
  authorHandle?: string;
  authorName?: string;
  profileImageUrl?: string;
  url?: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  createdAt?: string;
}

export interface ReferenceCardProps {
  reference: BrandReference;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string | null) => void;
  onUpdateApplicableTo: (id: string, applicableTo: string[]) => void;
  isDeleting: boolean;
}

export interface AddReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  voiceId: string;
  initialStep?: "source" | "tweet-url" | "import-x" | "custom";
}

export interface FetchedTweetResponse {
  tweetId: string;
  content: string;
  authorHandle: string;
  authorName: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  profileImageUrl: string | null;
  createdAt: string;
}
