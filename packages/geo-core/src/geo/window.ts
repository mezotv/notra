import type { GeoWindowInput } from "../types/geo";

export function geoWindow(input: {
  days?: number;
  from?: string;
  to?: string;
}): GeoWindowInput {
  return { days: input.days, from: input.from, to: input.to };
}

export function geoTrafficWindowParams(
  window: GeoWindowInput,
  fallbackDays: number
): { days: number; date_from: string; date_to: string } {
  return {
    days: window.days ?? fallbackDays,
    date_from: window.from ?? "",
    date_to: window.to ?? "",
  };
}
