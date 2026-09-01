import type { ComponentType, SVGProps } from "react";

export interface MarqueeLogo {
  name: string;
  label: string;
  Logo: ComponentType<SVGProps<SVGSVGElement>>;
}
