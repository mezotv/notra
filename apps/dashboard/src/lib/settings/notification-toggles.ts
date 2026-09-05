import {
  Alert02Icon,
  Calendar03Icon,
  Forward02Icon,
  Megaphone01Icon,
  News01Icon,
} from "@hugeicons/core-free-icons";

import type { NotificationToggleGroup } from "@/types/settings/notifications";

export const NOTIFICATION_TOGGLE_GROUPS: NotificationToggleGroup[] = [
  {
    heading: "Content",
    toggles: [
      {
        key: "scheduledContentCreation",
        label: "Created",
        description: "Get notified when content is created",
        defaultValue: false,
        icon: Calendar03Icon,
      },
      {
        key: "scheduledContentFailed",
        label: "Failed",
        description: "Get notified when generation fails",
        defaultValue: false,
        icon: Alert02Icon,
      },
      {
        key: "scheduledContentSkipped",
        label: "Skipped",
        description: "Get notified when generation is skipped",
        defaultValue: false,
        icon: Forward02Icon,
      },
    ],
  },
  {
    heading: "GEO",
    toggles: [
      {
        key: "dailySummary",
        label: "Daily recap",
        description:
          "Get one email each morning with yesterday's mention rate and what changed. Quiet days are skipped.",
        defaultValue: true,
        icon: News01Icon,
      },
    ],
  },
  {
    heading: "Marketing Emails",
    toggles: [
      {
        key: "marketingEmails",
        label: "Product updates",
        description:
          "Receive emails about new features, tips, and announcements",
        defaultValue: true,
        icon: Megaphone01Icon,
      },
    ],
  },
];
