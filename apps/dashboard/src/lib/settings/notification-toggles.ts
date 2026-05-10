import type { NotificationToggleGroup } from "@/types/settings/notifications";

export const NOTIFICATION_TOGGLE_GROUPS: NotificationToggleGroup[] = [
  {
    heading: "Email Notifications",
    toggles: [
      {
        key: "scheduledContentCreation",
        label: "Scheduled content creation",
        description: "Receive an email when scheduled content is created",
        defaultValue: false,
      },
      {
        key: "scheduledContentFailed",
        label: "Scheduled content failures",
        description: "Receive an email when scheduled content generation fails",
        defaultValue: false,
      },
      {
        key: "scheduledContentSkipped",
        label: "Scheduled content skips",
        description:
          "Receive an email when scheduled content generation is skipped",
        defaultValue: false,
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
      },
    ],
  },
];
