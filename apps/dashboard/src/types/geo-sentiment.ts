export interface BrandSentimentCardProps {
  organizationId: string;
  isScanning: boolean;
}

export interface SentimentShareProps {
  value: number | null;
}

export interface SentimentEvidenceListProps {
  organizationId: string;
  enabled: boolean;
}

export interface SentimentEvidenceProps {
  organizationId: string;
  negativeCount: number;
}
