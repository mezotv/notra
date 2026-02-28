"use client";

import BackgroundControl from "./BackgroundControl";
import styles from "./Controls.module.css";
import DarkModeControl from "./DarkModeControl";
import LanguageControl from "./LanguageControl";
import LineNumberControl from "./LineNumberControl";
import PaddingControl from "./PaddingControl";
import ThemeControl from "./ThemeControl";

const Controls = () => {
  return (
    <div className={styles.controls}>
      <ThemeControl />
      <BackgroundControl />
      <DarkModeControl />
      <LineNumberControl />
      <PaddingControl />
      <LanguageControl />
    </div>
  );
};

export default Controls;
