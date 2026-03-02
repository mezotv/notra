import type { HighlighterCore } from "@shikijs/core";
import { atom } from "jotai";
import { atomWithHash } from "jotai-location";

type HashAtom<T> = ReturnType<typeof atomWithHash<T>>;

export const windowWidthAtom: HashAtom<number | null> = atomWithHash<
  number | null
>("width", null);

export const showBackgroundAtom: HashAtom<boolean> = atomWithHash<boolean>(
  "background",
  true
);

export const showLineNumbersAtom: HashAtom<boolean | undefined> = atomWithHash<
  boolean | undefined
>("lineNumbers", undefined);

export const fileNameAtom: HashAtom<string> = atomWithHash<string>(
  "title",
  "",
  {
    serialize(val) {
      return val;
    },
    deserialize(str) {
      return str || "";
    },
  }
);

export const highlighterAtom = atom<HighlighterCore | null>(null);

export const loadingLanguageAtom = atom<boolean>(false);

export const highlightedLinesAtom: HashAtom<number[]> = atomWithHash<number[]>(
  "highlightedLines",
  [],
  {
    serialize(val) {
      return val.join(",");
    },
    deserialize(str) {
      return str ? str.split(",").map(Number) : [];
    },
  }
);
