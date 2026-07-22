import type { ReactElement } from "react";
import type { MegaIconProps } from "@/components/navbar-mega-icons";
import {
  BlogIcon,
  ChangelogIcon,
  CliIcon,
  ContributorsIcon,
  DocsIcon,
  FeaturesIcon,
  MarketingAssetsIcon,
  McpServerIcon,
  ReviewsIcon,
} from "@/components/navbar-mega-icons";

export const MEGA_NAV_ICONS: Record<
  string,
  (props: MegaIconProps) => ReactElement
> = {
  "/features": FeaturesIcon,
  "/features/marketing/assets": MarketingAssetsIcon,
  "https://docs.usenotra.com/devtools/mcp": McpServerIcon,
  "https://docs.usenotra.com/devtools/cli": CliIcon,
  "/blog": BlogIcon,
  "/changelog/notra": ChangelogIcon,
  "/contributors": ContributorsIcon,
  "https://docs.usenotra.com": DocsIcon,
  "https://www.notrareviews.com/": ReviewsIcon,
};
