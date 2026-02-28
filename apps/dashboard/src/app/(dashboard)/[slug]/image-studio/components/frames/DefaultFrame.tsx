"use client";

import classNames from "classnames";
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
import styles from "./DefaultFrame.module.css";

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
      className={classNames(
        styles.frame,
        styles[theme.id as keyof typeof styles],
        darkMode ? styles.darkMode : styles.lightMode,
        showBackground && styles.withBackground
      )}
      style={{
        padding,
        backgroundImage: showBackground ? themeBackground : "",
      }}
    >
      {!showBackground && (
        <div className={styles.transparentPattern} data-ignore-in-export />
      )}
      <div
        className={classNames(
          styles.window,
          !isSafari && styles.withBorder,
          !isSafari && showBackground && styles.withShadow
        )}
      >
        <div className={styles.header}>
          <div className={styles.controls}>
            <div className={styles.control} />
            <div className={styles.control} />
            <div className={styles.control} />
          </div>
          <div className={styles.fileName}>
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
