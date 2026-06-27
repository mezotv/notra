type PaperLayerKind = "frame" | "text" | "image" | "rect";

export interface PaperLayer {
  id: string;
  name: string;
  kind: PaperLayerKind;
  depth?: number;
  locked?: boolean;
}

export interface PaperRowReveal {
  layer: PaperLayer;
  progress: number;
}

export interface PaperSidebarProps {
  pasted?: PaperRowReveal[];
  selectedId?: string;
}
