"use client";

import { useAtom, useAtomValue } from "jotai";
import { useContext } from "react";
import { FrameContext } from "../store/FrameContextStore";
import { themeAtom, themeDarkModeAtom } from "../store/themes";

import FlashMessage from "./FlashMessage";
import styles from "./Frame.module.css";
import DefaultFrame from "./frames/DefaultFrame";
import ResizableFrame from "./ResizableFrame";

const Frame = () => {
  const frameContext = useContext(FrameContext);
  const [theme] = useAtom(themeAtom);
  const darkMode = useAtomValue(themeDarkModeAtom);

  return (
    <div
      className={styles.frameContainer}
      data-theme={darkMode ? "dark" : "light"}
    >
      <ResizableFrame>
        <FlashMessage />
        <div className={styles.outerFrame} id="frame" ref={frameContext}>
          <DefaultFrame />
        </div>
      </ResizableFrame>
    </div>
  );
};

export default Frame;
