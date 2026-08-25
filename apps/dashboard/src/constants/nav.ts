import {
  Activity01Icon,
  AiBrowserIcon,
  AiChat01Icon,
  Analytics01Icon,
  AnalyticsUpIcon,
  Attachment01Icon,
  Calendar03Icon,
  ChartAnalysisIcon,
  Comment01Icon,
  CreditCardIcon,
  Home01Icon,
  Key01Icon,
  MagicWand01Icon,
  Message01Icon,
  NoteIcon,
  Notification03Icon,
  PaintBoardIcon,
  PencilEdit01Icon,
  PlugIcon,
  PlusSignIcon,
  RainbowIcon,
  SearchList01Icon,
  Settings01Icon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { AGENT_FEEDBACK_NAV_LINK } from "@/constants/agent-feedback";
import {
  GEO_GAPS_NAV_LINK,
  GEO_PROMPTS_NAV_LINK,
  GEO_WRITER_NAV_LINK,
} from "@/constants/geo";
import { IRIS_NAV_LINK } from "@/constants/iris";
import type { PostStatus } from "@/schemas/content";
import type {
  NavGroupKey,
  NavMainItem,
  NavPrimaryActionConfig,
  NavSettingsItem,
  NavVisibility,
  SidebarMode,
  SidebarModeOption,
} from "@/types/components/nav";

export const HOME_NAV_LINK = "";
export const CHAT_NAV_LINK = "/chat";
export const CONTENT_NAV_LINK = "/content";
export const ANALYTICS_NAV_LINK = "/analytics";
export const BRAND_IDENTITY_NAV_LINK = "/brand/identity";
export const SCHEDULES_NAV_LINK = "/automation/schedules";
export const EVENTS_NAV_LINK = "/automation/events";
export const INTEGRATIONS_NAV_LINK = "/integrations";
export const SKILLS_NAV_LINK = "/skills";
export const API_KEYS_NAV_LINK = "/api-keys";
export const GEO_OVERVIEW_NAV_LINK = "/geo";
export const GEO_TRAFFIC_NAV_LINK = "/geo/traffic";
export const GEO_COMPETITORS_NAV_LINK = "/geo/competitors";
export const GEO_SETTINGS_NAV_LINK = "/geo/settings";

export const SIDEBAR_DEFAULT_MODE: SidebarMode = "geo";

export const SIDEBAR_MODES: SidebarModeOption[] = [
  { id: "geo", label: "GEO", icon: AiBrowserIcon },
  { id: "studio", label: "Studio", icon: NoteIcon },
];

export const SIDEBAR_MODE_HOME_LINKS: Record<SidebarMode, string> = {
  geo: GEO_OVERVIEW_NAV_LINK,
  studio: HOME_NAV_LINK,
};

export const GEO_ROUTE_SECTIONS: ReadonlySet<string> = new Set([
  "geo",
  "feedback",
]);

export const STUDIO_ROUTE_SECTIONS: ReadonlySet<string> = new Set([
  "chat",
  "content",
  "collection",
  "analytics",
  "brand",
  "automation",
  "iris",
]);

export const NAV_CATEGORY_LABELS: Record<NavGroupKey, string> = {
  visibility: "Visibility",
  improve: "Improve",
  automation: "Automation",
  utility: "Utility",
};

export const NAV_MAIN_ITEMS: NavMainItem[] = [
  { link: HOME_NAV_LINK, icon: Home01Icon, label: "Home" },
  { link: CHAT_NAV_LINK, icon: Message01Icon, label: "Chat", badge: "Beta" },
  { link: CONTENT_NAV_LINK, icon: NoteIcon, label: "Content" },
  { link: ANALYTICS_NAV_LINK, icon: Analytics01Icon, label: "Analytics" },
  {
    link: AGENT_FEEDBACK_NAV_LINK,
    icon: Comment01Icon,
    label: "Feedback",
    badge: "Beta",
  },
  {
    link: BRAND_IDENTITY_NAV_LINK,
    icon: PaintBoardIcon,
    label: "Brand Identity",
  },
  { link: IRIS_NAV_LINK, icon: RainbowIcon, label: "Iris" },
  { link: SCHEDULES_NAV_LINK, icon: Calendar03Icon, label: "Schedules" },
  { link: EVENTS_NAV_LINK, icon: Notification03Icon, label: "Events" },
  { link: INTEGRATIONS_NAV_LINK, icon: PlugIcon, label: "Integrations" },
  { link: GEO_OVERVIEW_NAV_LINK, icon: AiBrowserIcon, label: "Overview" },
  { link: GEO_TRAFFIC_NAV_LINK, icon: Activity01Icon, label: "Traffic" },
  { link: GEO_PROMPTS_NAV_LINK, icon: AiChat01Icon, label: "Prompts" },
  { link: GEO_GAPS_NAV_LINK, icon: SearchList01Icon, label: "Content Gaps" },
  {
    link: GEO_COMPETITORS_NAV_LINK,
    icon: ChartAnalysisIcon,
    label: "Competitors",
  },
  { link: GEO_WRITER_NAV_LINK, icon: PencilEdit01Icon, label: "Write" },
  { link: GEO_SETTINGS_NAV_LINK, icon: Settings01Icon, label: "GEO settings" },
  { link: SKILLS_NAV_LINK, icon: MagicWand01Icon, label: "Skills" },
  { link: API_KEYS_NAV_LINK, icon: Key01Icon, label: "API Keys" },
];

export const NAV_GEO_VISIBILITY_LINKS: readonly string[] = [
  GEO_OVERVIEW_NAV_LINK,
  GEO_PROMPTS_NAV_LINK,
  GEO_COMPETITORS_NAV_LINK,
  GEO_TRAFFIC_NAV_LINK,
  AGENT_FEEDBACK_NAV_LINK,
];

export const NAV_GEO_IMPROVE_LINKS: readonly string[] = [
  GEO_GAPS_NAV_LINK,
  GEO_WRITER_NAV_LINK,
  CONTENT_NAV_LINK,
  SCHEDULES_NAV_LINK,
];

export const NAV_GEO_LINKS: readonly string[] = [
  ...NAV_GEO_VISIBILITY_LINKS,
  ...NAV_GEO_IMPROVE_LINKS,
];

export const NAV_STUDIO_LINKS: readonly string[] = [
  HOME_NAV_LINK,
  CHAT_NAV_LINK,
  CONTENT_NAV_LINK,
  ANALYTICS_NAV_LINK,
  BRAND_IDENTITY_NAV_LINK,
];

export const NAV_AUTOMATION_LINKS: readonly string[] = [
  IRIS_NAV_LINK,
  SCHEDULES_NAV_LINK,
  EVENTS_NAV_LINK,
];

export const NAV_STUDIO_ALL_LINKS: readonly string[] = [
  ...NAV_STUDIO_LINKS,
  ...NAV_AUTOMATION_LINKS,
];

export const NAV_UTILITY_LINKS: readonly string[] = [
  INTEGRATIONS_NAV_LINK,
  SKILLS_NAV_LINK,
  API_KEYS_NAV_LINK,
];

export const DEFAULT_NAV_VISIBILITY: NavVisibility = {
  iris: true,
  writer: true,
  analytics: true,
};

export const NAV_PRIMARY_ACTIONS: Record<SidebarMode, NavPrimaryActionConfig> =
  {
    geo: { label: "Write", icon: PencilEdit01Icon },
    studio: { label: "New post", icon: PlusSignIcon },
  };

export const NAV_SEARCH_LABEL = "Search";
export const NAV_SEARCH_SHORTCUT_KEY = "K";
export const NAV_RECENT_LABEL = "Recent";
export const NAV_RECENT_LIMIT = 3;
export const NAV_RECENT_SKELETON_IDS = ["first", "second", "third"] as const;
export const NAV_PROJECTS_MENU_LABEL = "Projects";
export const NAV_NEW_PROJECT_LABEL = "New project";

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export const POST_STATUS_DOT_CLASS: Record<PostStatus, string> = {
  draft: "bg-muted-foreground/50",
  published: "bg-emerald-500",
};

export const SETTINGS_ACCOUNT_NAV_ITEMS: NavSettingsItem[] = [
  { label: "Account", url: "settings/account", icon: UserCircleIcon },
];

export const SETTINGS_ORGANIZATION_NAV_ITEMS: NavSettingsItem[] = [
  { label: "General", url: "settings/general", icon: Settings01Icon },
  { label: "Members", url: "settings/members", icon: UserGroupIcon },
  {
    label: "Notifications",
    url: "settings/notifications",
    icon: Notification03Icon,
  },
  {
    label: "Attachments",
    url: "settings/attachments",
    icon: Attachment01Icon,
  },
  { label: "Billing & Usage", url: "settings/billing", icon: CreditCardIcon },
  {
    label: "Credits",
    url: "settings/credits",
    icon: Wallet01Icon,
    requiresAiCredits: true,
  },
  { label: "Logs", url: "settings/logs", icon: AnalyticsUpIcon },
];
