import {
  AnalyticsUpIcon,
  Calendar03Icon,
  Comment01Icon,
  CorporateIcon,
  CreditCardIcon,
  Home01Icon,
  Key01Icon,
  Message01Icon,
  NoteIcon,
  Notification03Icon,
  PlugIcon,
  Settings01Icon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type {
  CommandRoute,
  CommandSection,
} from "@/types/components/command-palette";

export type {
  CommandRoute,
  CommandSection,
} from "@/types/components/command-palette";

export const COMMAND_ROUTES: CommandRoute[] = [
  {
    id: "home",
    label: "Home",
    keywords: ["dashboard", "start", "overview"],
    icon: Home01Icon,
    section: "Navigation",
    path: (slug) => `/${slug}`,
  },
  {
    id: "chat",
    label: "Chat",
    keywords: ["ai", "assistant", "conversation", "message"],
    icon: Message01Icon,
    section: "Navigation",
    path: (slug) => `/${slug}/chat`,
  },
  {
    id: "content",
    label: "Content",
    keywords: ["posts", "drafts", "notes", "articles"],
    icon: NoteIcon,
    section: "Workspace",
    path: (slug) => `/${slug}/content`,
  },
  {
    id: "brand-company-info",
    label: "Company Info",
    keywords: ["brand", "identity", "voice", "tone", "company"],
    icon: CorporateIcon,
    section: "Workspace",
    path: (slug) => `/${slug}/brand/identity`,
  },
  {
    id: "brand-references",
    label: "References",
    keywords: ["brand", "identity", "references", "examples", "posts"],
    icon: Comment01Icon,
    section: "Workspace",
    path: (slug) => `/${slug}/brand/identity?view=references`,
  },
  {
    id: "automation-schedules",
    label: "Schedules",
    keywords: ["cron", "recurring", "automation", "calendar"],
    icon: Calendar03Icon,
    section: "Automation",
    path: (slug) => `/${slug}/automation/schedules`,
  },
  {
    id: "automation-events",
    label: "Events",
    keywords: ["triggers", "webhooks", "automation"],
    icon: Notification03Icon,
    section: "Automation",
    path: (slug) => `/${slug}/automation/events`,
  },
  {
    id: "api-keys",
    label: "API Keys",
    keywords: ["tokens", "secrets", "credentials", "auth"],
    icon: Key01Icon,
    section: "Manage",
    path: (slug) => `/${slug}/api-keys`,
  },
  {
    id: "integrations",
    label: "Integrations",
    keywords: ["github", "linear", "framer", "raycast", "connect"],
    icon: PlugIcon,
    section: "Manage",
    path: (slug) => `/${slug}/integrations`,
  },
  {
    id: "logs",
    label: "Logs",
    keywords: ["audit", "activity", "events", "history"],
    icon: AnalyticsUpIcon,
    section: "Manage",
    path: (slug) => `/${slug}/logs`,
  },
  {
    id: "settings-account",
    label: "Account",
    keywords: ["profile", "user", "email", "password"],
    icon: UserCircleIcon,
    section: "Settings",
    path: (slug) => `/${slug}/settings/account`,
  },
  {
    id: "settings-general",
    label: "General Settings",
    keywords: ["organization", "workspace", "name", "logo"],
    icon: Settings01Icon,
    section: "Settings",
    path: (slug) => `/${slug}/settings/general`,
  },
  {
    id: "settings-members",
    label: "Members",
    keywords: ["team", "users", "invite", "people"],
    icon: UserGroupIcon,
    section: "Settings",
    path: (slug) => `/${slug}/settings/members`,
  },
  {
    id: "settings-notifications",
    label: "Notifications",
    keywords: ["alerts", "email", "preferences"],
    icon: Notification03Icon,
    section: "Settings",
    path: (slug) => `/${slug}/settings/notifications`,
  },
  {
    id: "settings-billing",
    label: "Billing & Usage",
    keywords: ["subscription", "plan", "invoice", "payment"],
    icon: CreditCardIcon,
    section: "Settings",
    path: (slug) => `/${slug}/settings/billing`,
  },
  {
    id: "settings-credits",
    label: "Credits",
    keywords: ["balance", "top up", "tokens", "ai"],
    icon: Wallet01Icon,
    section: "Settings",
    path: (slug) => `/${slug}/settings/credits`,
  },
];

export const COMMAND_SECTIONS: CommandSection[] = [
  "Navigation",
  "Workspace",
  "Automation",
  "Manage",
  "Settings",
];

export function commandRoutesForAI(slug: string) {
  return COMMAND_ROUTES.map((r) => ({
    id: r.id,
    label: r.label,
    path: r.path(slug),
    keywords: r.keywords,
  }));
}
