export const OPENCODE_COLORS = {
  background: "#fdfdfd",
  surface: "#f6f6f6",
  foreground: "#1d1d1d",
  muted: "#929292",
  subtle: "#dedede",
  purple: "#8256d6",
  orange: "#e48600",
  green: "#00a861",
} as const;

/** Beat before the first tool line during a replay. */
export const OPENCODE_SEARCH_HEADER_MS = 140;
/** Cadence between sequential tool lines. */
export const OPENCODE_SEARCH_QUERY_MS = 280;
/** Delay between cited-source rows. */
export const OPENCODE_SEARCH_STAGGER_MS = 56;
/** Pause after the last query before the sources block. */
export const OPENCODE_SEARCH_SOURCES_MS = 160;
