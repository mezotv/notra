import type { EngineId } from "@/types/landing/geo";

export interface HeroDitherProps {
  className?: string;
}

export interface HeroCycleWord {
  text: string;
  engine: EngineId;
}

export interface HeroHeadlineProps {
  word: HeroCycleWord;
}

export interface HeroCollageProps {
  engine: EngineId;
}
