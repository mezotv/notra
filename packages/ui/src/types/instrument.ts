import type { ReactNode } from "react";

export interface InstrumentModuleProps {
  eyebrow: string;
  description?: ReactNode;
  readout?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: "flat" | "panel";
  bareBody?: boolean;
}

export interface InstrumentEmptyProps {
  seed?: string;
  message: string;
  className?: string;
  busy?: boolean;
  action?: ReactNode;
  preview?: ReactNode;
}
