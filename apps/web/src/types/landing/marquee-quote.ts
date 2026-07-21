import type { ComponentType, SVGProps } from "react";

export interface MarqueeLogo {
  name: string;
  label: string;
  Logo: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface FounderQuoteData {
  quote: string;
  name: string;
  role: string;
  avatarSrc: string;
  avatarAlt: string;
}
