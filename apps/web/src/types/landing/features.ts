import type { ReactNode } from "react";

export interface FeaturesCardCopy {
  title: string;
  description: string;
}

export interface FeaturesShaderProps {
  colorFront: string;
  className?: string;
}

export interface FeaturesCardShellProps {
  copy: FeaturesCardCopy;
  shaderColorFront: string;
  shaderClassName?: string;
  containerClassName?: string;
  className?: string;
  children: ReactNode;
}

export interface FeaturesConnectCard {
  name: string;
  description: string;
}

export type FeaturesPermissionLevel = "read" | "write";

export interface FeaturesPermission {
  name: string;
  description: string;
  active: FeaturesPermissionLevel;
}

export interface FeaturesToolCard {
  title: string;
  description: string;
}
