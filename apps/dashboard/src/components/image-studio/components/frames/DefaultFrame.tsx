"use client";

import { useAtom, useAtomValue } from "jotai";

import { fileNameAtom, showBackgroundAtom } from "../../store";
import { paddingAtom } from "../../store/padding";
import {
  themeAtom,
  themeBackgroundAtom,
  themeDarkModeAtom,
} from "../../store/themes";
import useIsSafari from "../../util/useIsSafari";
import Editor from "../Editor";

const DefaultFrame = () => {
  const [padding] = useAtom(paddingAtom);
  const isSafari = useIsSafari();
  const [showBackground] = useAtom(showBackgroundAtom);
  const [fileName, setFileName] = useAtom(fileNameAtom);
  const [themeBackground] = useAtom(themeBackgroundAtom);
  const [theme] = useAtom(themeAtom);
  const darkMode = useAtomValue(themeDarkModeAtom);

  return (
    <div
      data-mode={darkMode ? "dark" : "light"}
      data-show-background={showBackground || undefined}
      data-studio-frame=""
      data-theme-id={theme.id}
      style={{
        padding,
        backgroundImage: showBackground ? themeBackground : "",
      }}
    >
      {!showBackground && (
        <div data-ignore-in-export data-studio-transparent-pattern="" />
      )}
      <div
        data-studio-window=""
        data-with-border={!isSafari || undefined}
        data-with-shadow={(!isSafari && showBackground) || undefined}
      >
        <div className="grid h-6 items-center gap-3 px-4 [grid-template-columns:3.75rem_1fr_3.75rem]">
          <div className="flex gap-2">
            <div
              className="size-3.5 rounded-full"
              style={{ backgroundColor: "var(--frame-control-color)" }}
            />
            <div
              className="size-3.5 rounded-full"
              style={{ backgroundColor: "var(--frame-control-color)" }}
            />
            <div
              className="size-3.5 rounded-full"
              style={{ backgroundColor: "var(--frame-control-color)" }}
            />
          </div>
          <div data-studio-file-name="">
            <input
              onChange={(event) => setFileName(event.target.value)}
              spellCheck={false}
              tabIndex={-1}
              type="text"
              value={fileName}
            />
            {fileName.length === 0 ? (
              <span data-ignore-in-export>Untitled-1</span>
            ) : null}
          </div>
        </div>
        <Editor />
      </div>
    </div>
  );
};

export default DefaultFrame;
