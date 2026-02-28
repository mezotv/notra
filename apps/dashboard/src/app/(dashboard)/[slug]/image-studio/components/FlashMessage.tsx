"use client";

import { useAtom } from "jotai";
import { useRef } from "react";
import { derivedFlashMessageAtom, flashShownAtom } from "../store/flash";
import styles from "./FlashMessage.module.css";

const FlashMessage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flashMessage] = useAtom(derivedFlashMessageAtom);
  const [flashShown] = useAtom(flashShownAtom);

  if (!flashShown) {
    return null;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <span className={styles.flash}>
        {flashMessage?.icon}
        {flashMessage?.message}
      </span>
    </div>
  );
};

export default FlashMessage;
