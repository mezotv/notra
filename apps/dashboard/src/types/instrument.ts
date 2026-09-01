export type {
  InstrumentEmptyProps,
  InstrumentModuleProps,
} from "@notra/ui/types/instrument";

import type { ReactNode } from "react";

export interface InstrumentGridProps {
  children: ReactNode;
  className?: string;
}

export interface InstrumentRevealProps {
  active: boolean;
  order?: number;
  children: ReactNode;
  className?: string;
}
