export type HeroCollageGlyphType =
  | "twitter_post"
  | "changelog"
  | "blog_post"
  | "image";

export interface HeroCollageContentRow {
  id: string;
  name: string;
  type: HeroCollageGlyphType;
}

export interface HeroCollageEventRow {
  id: string;
  type: string;
  event: string;
  output: string;
}
