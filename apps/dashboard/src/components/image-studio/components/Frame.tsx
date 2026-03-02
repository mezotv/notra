"use client";

import { useAtom, useAtomValue } from "jotai";
import { useContext } from "react";
import { FrameContext } from "../store/FrameContextStore";
import { themeAtom, themeDarkModeAtom } from "../store/themes";

import FlashMessage from "./FlashMessage";
import DefaultFrame from "./frames/DefaultFrame";
import ResizableFrame from "./ResizableFrame";

const Frame = () => {
  const frameContext = useContext(FrameContext);
  const [theme] = useAtom(themeAtom);
  const darkMode = useAtomValue(themeDarkModeAtom);

  return (
    <div
      className="flex origin-top justify-center"
      data-theme={darkMode ? "dark" : "light"}
    >
      <ResizableFrame>
        <FlashMessage />
        <div
          className="relative max-w-[40rem] overflow-hidden"
          id="frame"
          ref={frameContext}
        >
          <DefaultFrame />
        </div>
      </ResizableFrame>
    </div>
  );
};

export default Frame;
