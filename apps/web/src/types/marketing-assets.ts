export interface AssetShowcaseSection {
  id: string;
  headingPre: string;
  headingAccent: string;
  headingPost: string;
  paragraphs: string[];
  videoSrc: string;
  posterSrc: string;
  videoLabel: string;
  mediaSide: "left" | "right";
}

export interface LoopVideoProps {
  src: string;
  poster: string;
  label: string;
}
