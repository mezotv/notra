import type {
  HeroCollageContentRow,
  HeroCollageEventRow,
} from "@/types/landing/hero-collage";

export const HERO_COLLAGE_CONTENT = {
  heading: "Content",
  subhead: "Every batch of generated content, organized into collections.",
  nameHeader: "Name",
  typesHeader: "Types",
};

export const HERO_COLLAGE_CONTENT_ROWS: HeroCollageContentRow[] = [
  {
    id: "row-1",
    name: "v0.4 release notes and launch thread",
    type: "twitter_post",
  },
  {
    id: "row-2",
    name: "MCP server GA changelog",
    type: "changelog",
  },
  {
    id: "row-3",
    name: "Slack integration launch post",
    type: "blog_post",
  },
  {
    id: "row-4",
    name: "Launch week recap visuals",
    type: "image",
  },
  {
    id: "row-5",
    name: "Dashboard redesign announcement",
    type: "image",
  },
  {
    id: "row-6",
    name: "CLI quickstart social assets",
    type: "image",
  },
  {
    id: "row-7",
    name: "Customer story: stagewise",
    type: "image",
  },
  {
    id: "row-8",
    name: "API keys and permissions update",
    type: "image",
  },
  {
    id: "row-9",
    name: "Docs refresh announcement",
    type: "image",
  },
  {
    id: "row-10",
    name: "Integration marketplace teaser",
    type: "image",
  },
  {
    id: "row-11",
    name: "Brand voice deep-dive thread",
    type: "image",
  },
  {
    id: "row-12",
    name: "Weekly shipped digest",
    type: "image",
  },
  {
    id: "row-13",
    name: "Onboarding agent walkthrough",
    type: "image",
  },
  {
    id: "row-14",
    name: "Community contributors spotlight",
    type: "image",
  },
];

export const HERO_COLLAGE_PROFILE = {
  heading: "Company Profile",
  subhead: "Configure your brand identity and tone",
  sectionCompany: "Company Profile",
  companyNameLabel: "Company name",
  companyNameValue: "Acme Robotics",
  websiteLabel: "Website",
  websitePrefix: "https://",
  websiteValue: "acmerobotics.dev/",
  descriptionLabel: "Description",
  descriptionValue: "Acme Robotics builds warehouse automation for …",
  sectionAudience: "Target Audience",
  audienceLabel: "Who are you writing for?",
  audienceValue: "Operations leads, robotics engineers, and logistics …",
  sectionTone: "Tone & Language",
  toneProfileLabel: "Tone Profile",
  toneProfileValue: "Professional",
  customToneLabel: "Custom Tone",
  customTonePlaceholder: "Add custom tone notes...",
  languageLabel: "Language",
  languageValue: "English",
  languageFlag: "🇺🇸",
  customInstructionsLabel: "Custom Instructions",
  customInstructionsPlaceholder:
    "Add any specific instructions for AI-generated content",
};

export const HERO_COLLAGE_EVENTS = {
  heading: "Events",
  subhead:
    "React to GitHub activity and trigger content generation automatically",
  activeTab: "Active (1)",
  pausedTab: "Paused (0)",
  typeHeader: "Type",
  eventsHeader: "Events",
  outputHeader: "Output",
};

export const HERO_COLLAGE_EVENT_ROWS: HeroCollageEventRow[] = [
  {
    id: "event-1",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-2",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-3",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-4",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-5",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-6",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-7",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-8",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-9",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
  {
    id: "event-10",
    type: "GitHub Webhook",
    event: "Release",
    output: "Changelog",
  },
];
