import type { IntegrationType } from "@/schemas/integrations";

export interface IntegrationConfig {
  id: IntegrationType;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  href: string;
  available: boolean;
  category: "input" | "output";
}
