"use client";

import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
} from "react";

const FrameContext = createContext(0);

export function FrameProvider({
  frame,
  children,
}: {
  frame: number;
  children: ReactNode;
}) {
  return (
    <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>
  );
}

export function useCurrentFrame(): number {
  return useContext(FrameContext);
}

const LEADING_SLASHES = /^\/+/;

export function staticFile(path: string): string {
  return `/${path.replace(LEADING_SLASHES, "")}`;
}

export function AbsoluteFill({
  style,
  children,
}: {
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Img({
  src,
  style,
  alt = "",
}: {
  src: string;
  style?: CSSProperties;
  alt?: string;
}) {
  return <img alt={alt} src={src} style={style} />;
}

const HASH_MODULUS = 1_000_000_007;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) % HASH_MODULUS;
  }
  return hash;
}

export function random(seed: number | string | null): number {
  const base = typeof seed === "string" ? hashString(seed) : (seed ?? 0);
  const value = Math.sin(base * 12.9898 + 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

type EasingFunction = (input: number) => number;

function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): EasingFunction {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solveX = (x: number) => {
    let t = x;
    for (let index = 0; index < 8; index++) {
      const xEstimate = sampleX(t) - x;
      if (Math.abs(xEstimate) < 1e-6) {
        return t;
      }
      const derivative = sampleDerivativeX(t);
      if (Math.abs(derivative) < 1e-6) {
        break;
      }
      t -= xEstimate / derivative;
    }
    let low = 0;
    let high = 1;
    t = x;
    while (low < high) {
      const xEstimate = sampleX(t);
      if (Math.abs(xEstimate - x) < 1e-6) {
        return t;
      }
      if (x > xEstimate) {
        low = t;
      } else {
        high = t;
      }
      t = (low + high) / 2;
    }
    return t;
  };

  return (x: number) => sampleY(solveX(x));
}

export const Easing = {
  linear: (t: number) => t,
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  bezier: (x1: number, y1: number, x2: number, y2: number) =>
    cubicBezier(x1, y1, x2, y2),
  in: (easing: EasingFunction) => easing,
  out: (easing: EasingFunction) => (t: number) => 1 - easing(1 - t),
  inOut: (easing: EasingFunction) => (t: number) =>
    t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
};

type ExtrapolateType = "extend" | "clamp" | "identity";

interface InterpolateOptions {
  easing?: EasingFunction;
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
}

function findRange(input: number, inputRange: readonly number[]): number {
  let index = 1;
  for (; index < inputRange.length - 1; index++) {
    const value = inputRange[index];
    if (value !== undefined && value >= input) {
      break;
    }
  }
  return index - 1;
}

function interpolateSegment(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  options: Required<InterpolateOptions>
): number {
  let result = input;
  if (result < inputMin) {
    if (options.extrapolateLeft === "identity") {
      return result;
    }
    if (options.extrapolateLeft === "clamp") {
      result = inputMin;
    }
  }
  if (result > inputMax) {
    if (options.extrapolateRight === "identity") {
      return result;
    }
    if (options.extrapolateRight === "clamp") {
      result = inputMax;
    }
  }
  if (outputMin === outputMax) {
    return outputMin;
  }
  result = (result - inputMin) / (inputMax - inputMin);
  result = options.easing(result);
  return result * (outputMax - outputMin) + outputMin;
}

export function interpolate(
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options?: InterpolateOptions
): number {
  const resolved: Required<InterpolateOptions> = {
    easing: options?.easing ?? ((value: number) => value),
    extrapolateLeft: options?.extrapolateLeft ?? "extend",
    extrapolateRight: options?.extrapolateRight ?? "extend",
  };
  const range = findRange(input, inputRange);
  const inputMin = inputRange[range] ?? 0;
  const outputMin = outputRange[range] ?? 0;
  return interpolateSegment(
    input,
    inputMin,
    inputRange[range + 1] ?? inputMin,
    outputMin,
    outputRange[range + 1] ?? outputMin,
    resolved
  );
}
