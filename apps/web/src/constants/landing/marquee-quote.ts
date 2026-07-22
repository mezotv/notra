import {
  DatabuddyLogo,
  EmdashLogo,
  InthLogo,
  StackAuthLogo,
} from "@/components/landing/marquee-logos";
import type {
  FounderQuoteData,
  MarqueeLogo,
} from "@/types/landing/marquee-quote";

export const MARQUEE_CAPTION =
  "Fast-moving teams trust Notra to tell their story";

export const MARQUEE_EDGE_MASK =
  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)";

export const MARQUEE_LOGOS: MarqueeLogo[] = [
  { name: "inth", label: "Inth", Logo: InthLogo },
  { name: "databuddy", label: "Databuddy", Logo: DatabuddyLogo },
  { name: "emdash", label: "Emdash", Logo: EmdashLogo },
  { name: "stack-auth", label: "Stack Auth", Logo: StackAuthLogo },
];

export const FOUNDER_QUOTE: FounderQuoteData = {
  quote:
    "“I get content created from other people's work on the team, without asking them or really doing anything. Even the small things we ship, easy”",
  name: "Will De Ath",
  role: "Head of Growth, Inth (P26)",
  avatarSrc: "/testimonials/Will.webp",
  avatarAlt: "Will De Ath",
};
