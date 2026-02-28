import { atomWithHash } from "jotai-location";

export const FONTS = [
  "jetbrains-mono",
  "geist-mono",
  "ibm-plex-mono",
  "fira-code",
  "roboto-mono",
  "source-code-pro",
  "space-mono",
] as const;

export type Font = (typeof FONTS)[number];

const fontAtom: ReturnType<typeof atomWithHash<Font>> = atomWithHash<Font>(
  "font",
  FONTS[0]
);

export { fontAtom };
