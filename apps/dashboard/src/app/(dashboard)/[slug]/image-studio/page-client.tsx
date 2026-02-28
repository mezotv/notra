"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import type { HighlighterCore, LanguageInput } from "@shikijs/core";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import styles from "./code.module.css";
import Controls from "./components/Controls";
import ExportButton from "./components/ExportButton";
import Frame from "./components/Frame";
import NoSSR from "./components/NoSSR";
import { highlighterAtom } from "./store";
import FrameContextStore from "./store/FrameContextStore";
import { shikiTheme } from "./store/themes";
import { LANGUAGES } from "./util/languages";

export function ImageStudioClient() {
  const [highlighter, setHighlighter] = useAtom(highlighterAtom);

  useEffect(() => {
    createHighlighterCore({
      themes: [shikiTheme],
      langs: [
        LANGUAGES.javascript!.src() as LanguageInput,
        LANGUAGES.tsx!.src() as LanguageInput,
        LANGUAGES.swift!.src() as LanguageInput,
        LANGUAGES.python!.src() as LanguageInput,
      ],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    }).then((h: HighlighterCore) => {
      setHighlighter(h);
    });
  }, [setHighlighter]);

  return (
    <FrameContextStore>
      <div className={styles.app}>
        <NoSSR>
          {highlighter && <Frame />}
          <Controls />
        </NoSSR>
      </div>
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 30,
        }}
      >
        <ExportButton />
      </div>
    </FrameContextStore>
  );
}
