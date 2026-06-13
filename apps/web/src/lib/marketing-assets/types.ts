import type { z } from "zod";
import type { assetShowcaseSectionSchema } from "./schemas";

export type AssetShowcaseSection = z.infer<typeof assetShowcaseSectionSchema>;

export interface LoopVideoProps {
  src: string;
  poster: string;
  label: string;
}
