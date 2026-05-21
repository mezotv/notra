export interface VectorVertex {
  x: number;
  y: number;
  mirror?: number;
}

export interface VectorSegment {
  vStart: number;
  vEnd: number;
  tStartX?: number;
  tStartY?: number;
  tEndX?: number;
  tEndY?: number;
  mirror?: number;
}

export interface VectorLoop {
  segmentIndices: number[];
}

export interface VectorRegion {
  loops: VectorLoop[];
  windingRule?: "NONZERO" | "ODD";
}

export interface VectorNetwork {
  vertices: VectorVertex[];
  segments: VectorSegment[];
  regions: VectorRegion[];
}
