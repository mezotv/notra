export interface PathPoint {
  x: number;
  y: number;
}

export interface PathSubpath {
  points: PathPoint[];
  closed: boolean;
}
