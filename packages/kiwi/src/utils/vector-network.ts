import type {
  VectorNetwork,
  VectorRegion,
  VectorSegment,
  VectorVertex,
} from "../types/vector-network";

export type {
  VectorLoop,
  VectorNetwork,
  VectorRegion,
  VectorSegment,
  VectorVertex,
} from "../types/vector-network";

export function encodeVectorNetwork(network: VectorNetwork): Uint8Array {
  let regionsBytes = 0;
  for (const r of network.regions) {
    regionsBytes += 4;
    for (const loop of r.loops) {
      regionsBytes += 4 + loop.segmentIndices.length * 4;
    }
    regionsBytes += 4;
  }
  const total =
    16 +
    network.vertices.length * 12 +
    network.segments.length * 28 +
    regionsBytes;

  const buf = new Uint8Array(total);
  const dv = new DataView(buf.buffer);
  let pos = 0;
  const writeU32 = (v: number) => {
    dv.setUint32(pos, v, true);
    pos += 4;
  };
  const writeF32 = (v: number) => {
    dv.setFloat32(pos, v, true);
    pos += 4;
  };

  writeU32(network.vertices.length);
  writeU32(network.segments.length);
  writeU32(network.regions.length);
  writeU32(0);

  for (const v of network.vertices) {
    writeF32(v.x);
    writeF32(v.y);
    writeU32(v.mirror ?? 0);
  }

  for (const s of network.segments) {
    writeU32(s.vStart);
    writeF32(s.tStartX ?? 0);
    writeF32(s.tStartY ?? 0);
    writeU32(s.vEnd);
    writeF32(s.tEndX ?? 0);
    writeF32(s.tEndY ?? 0);
    writeU32(s.mirror ?? 0);
  }

  for (const r of network.regions) {
    writeU32(r.loops.length);
    for (const loop of r.loops) {
      writeU32(loop.segmentIndices.length);
      for (const i of loop.segmentIndices) {
        writeU32(i);
      }
    }
    writeU32(r.windingRule === "ODD" ? 1 : 0);
  }

  return buf;
}

export function closedPolylineNetwork(
  points: Array<{ x: number; y: number }>
): VectorNetwork {
  if (points.length < 2) {
    return { vertices: [], segments: [], regions: [] };
  }
  const vertices: VectorVertex[] = points.map((p) => ({
    x: p.x,
    y: p.y,
    mirror: 0,
  }));
  const segments: VectorSegment[] = [];
  for (let i = 0; i < points.length; i += 1) {
    segments.push({
      vStart: i,
      vEnd: (i + 1) % points.length,
    });
  }
  const region: VectorRegion = {
    loops: [{ segmentIndices: segments.map((_, i) => i) }],
  };
  return { vertices, segments, regions: [region] };
}
