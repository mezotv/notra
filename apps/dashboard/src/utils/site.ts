import { getConfiguredAppUrl } from "@/utils/url";

export const SITE_CONFIG = {
  title: "Notra",
  description: "Notra - Content Management",
  url: getConfiguredAppUrl() ?? "http://localhost:3000",
} as const;
