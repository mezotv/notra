import type { GeoPromptResult } from "@notra/geo-core/types/geo";

export interface BrandSentimentCardProps {
  organizationId: string;
  isScanning: boolean;
}

export interface AnswerSentimentProps {
  result: Pick<
    GeoPromptResult,
    "mentioned" | "sentiment" | "answer" | "excerpt"
  >;
}
