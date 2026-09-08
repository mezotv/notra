export interface ProductFeature {
	text: string;
	overageText?: string;
	overageTooltip?: string;
}

export interface FeatureData {
	id: string;
	name: string;
	balance: number | null;
	included: number | null;
	unlimited: boolean;
}

export type UsageRangeOption = "7d" | "30d" | "90d" | "last_cycle";

export interface UsageLimitedFeatureRowProps {
	feature: FeatureData;
	range: UsageRangeOption;
}

export interface UsageSectionBodyProps {
	aiCreditsFeature: FeatureData | undefined;
	hasRetentionFeature: boolean;
	limitedFeatures: FeatureData[];
	onRangeChange: (range: UsageRangeOption) => void;
	range: UsageRangeOption;
	retentionDays: number;
	totalUsage: number;
	unlimitedFeatures: FeatureData[];
}
