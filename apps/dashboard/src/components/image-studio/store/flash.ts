import { atom } from "jotai";
import type { ReactNode } from "react";

export type FlashMessage = {
  icon?: ReactNode;
  message: string;
  timeout?: number;
};

const timeoutAtom = atom<number>(0);
const iconAtom = atom<ReactNode>(null);
const messageAtom = atom<string>("");
export const flashShownAtom = atom(false);

export const derivedFlashMessageAtom = atom(
  (get) => ({
    icon: get(iconAtom),
    message: get(messageAtom),
  }),
  (get, set, flashMessage: FlashMessage) => {
    window.clearTimeout(get(timeoutAtom));

    set(messageAtom, flashMessage.message);
    set(iconAtom, flashMessage.icon);
    set(flashShownAtom, true);

    if (flashMessage?.timeout) {
      set(
        timeoutAtom,
        window.setTimeout(() => {
          set(flashShownAtom, false);
          set(messageAtom, "");
        }, flashMessage.timeout)
      );
    }
  }
);
