import {
  CreditsIcon,
  IntegrationsIcon,
  ReferencesIcon,
  RetentionIcon,
  SupportIcon,
  TeamIcon,
  WorkflowsIcon,
} from "@/components/landing/pricing-icons";
import type { PricingIcon, PricingIconKey } from "@/types/landing/pricing";

export const PRICING_ICONS: Record<PricingIconKey, PricingIcon> = {
  team: TeamIcon,
  credits: CreditsIcon,
  workflows: WorkflowsIcon,
  integrations: IntegrationsIcon,
  references: ReferencesIcon,
  retention: RetentionIcon,
  support: SupportIcon,
};
