import {
  Activity01Icon,
  AiBrowserIcon,
  AiChat01Icon,
  Analytics01Icon,
  Calendar03Icon,
  ChartAnalysisIcon,
  Home01Icon,
  Key01Icon,
  MagicWand01Icon,
  Message01Icon,
  NoteIcon,
  Notification03Icon,
  PaintBoardIcon,
  PlugIcon,
  RainbowIcon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import { IRIS_NAV_LINK } from "@/constants/iris";
import type {
  NavDrilldownCategory,
  NavMainCategory,
  NavMainItem,
} from "@/types/components/nav";

export const CONTENT_NAV_LINK = "/content";

export const NAV_CATEGORY_LABELS: Record<
  Exclude<NavMainCategory, "none">,
  string
> = {
  workspace: "Workspace",
  automation: "Automation",
  geo: "GEO",
  utility: "Utility",
};

export const NAV_MAIN_ITEMS: NavMainItem[] = [
  {
    link: "",
    icon: Home01Icon,
    label: "Home",
    category: "none",
  },
  {
    link: "/chat",
    icon: Message01Icon,
    label: "Chat",
    category: "none",
    badge: "Beta",
  },
  {
    link: CONTENT_NAV_LINK,
    icon: NoteIcon,
    label: "Content",
    category: "workspace",
  },
  {
    link: "/analytics",
    icon: Analytics01Icon,
    label: "Analytics",
    category: "workspace",
  },
  {
    link: IRIS_NAV_LINK,
    icon: RainbowIcon,
    label: "Iris",
    category: "automation",
  },
  {
    link: "/automation/schedules",
    icon: Calendar03Icon,
    label: "Schedules",
    category: "automation",
  },
  {
    link: "/automation/events",
    icon: Notification03Icon,
    label: "Events",
    category: "automation",
  },
  {
    link: "/integrations",
    icon: PlugIcon,
    label: "Integrations",
    category: "automation",
  },
  {
    link: "/geo",
    icon: AiBrowserIcon,
    label: "Overview",
    category: "geo",
  },
  {
    link: "/geo/traffic",
    icon: Activity01Icon,
    label: "Traffic",
    category: "geo",
  },
  {
    link: "/geo/prompts",
    icon: AiChat01Icon,
    label: "Prompts",
    category: "geo",
  },
  {
    link: "/geo/competitors",
    icon: ChartAnalysisIcon,
    label: "Competitors",
    category: "geo",
  },
  {
    link: "/skills",
    icon: MagicWand01Icon,
    label: "Skills",
    category: "utility",
  },
  {
    link: "/api-keys",
    icon: Key01Icon,
    label: "API Keys",
    category: "utility",
  },
];

export const NAV_ITEMS_BY_CATEGORY: Record<NavMainCategory, NavMainItem[]> = {
  none: [],
  workspace: [],
  automation: [],
  geo: [],
  utility: [],
};
for (const item of NAV_MAIN_ITEMS) {
  NAV_ITEMS_BY_CATEGORY[item.category].push(item);
}

export const NAV_DRILLDOWN_CATEGORIES: NavDrilldownCategory[] = [
  "automation",
  "geo",
];

export const NAV_DRILLDOWN_ITEMS: NavMainItem[] = [
  {
    link: "/brand/identity",
    icon: PaintBoardIcon,
    label: "Brand Identity",
    category: "none",
  },
  {
    link: "/automation/schedules",
    icon: WorkflowSquare01Icon,
    label: NAV_CATEGORY_LABELS.automation,
    category: "none",
  },
  {
    link: "/geo",
    icon: AiBrowserIcon,
    label: NAV_CATEGORY_LABELS.geo,
    category: "none",
  },
];
