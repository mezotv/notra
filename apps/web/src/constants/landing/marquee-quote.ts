import { DatabuddyLogo } from "@/components/landing/marquee-logos/databuddy-logo";
import { InthLogo } from "@/components/landing/marquee-logos/inth-logo";
import { StackAuthLogo } from "@/components/landing/marquee-logos/stack-auth-logo";
import { TopGgLogo } from "@/components/landing/marquee-logos/top-gg-logo";
import type { MarqueeLogo } from "@/types/landing/marquee-quote";

export const MARQUEE_CAPTION = "Used by teams that ship every week";

export const MARQUEE_EDGE_MASK =
  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)";

export const MARQUEE_LOGOS: MarqueeLogo[] = [
  { name: "inth", label: "Inth", Logo: InthLogo },
  { name: "databuddy", label: "Databuddy", Logo: DatabuddyLogo },
  { name: "stack-auth", label: "Stack Auth", Logo: StackAuthLogo },
  { name: "top-gg", label: "Top.gg", Logo: TopGgLogo },
];
