"use client";

import classNames from "classnames";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadingLanguageAtom } from "../store";
import { autoDetectLanguageAtom, selectedLanguageAtom } from "../store/code";
import { LANGUAGES, type Language } from "../util/languages";
import ControlContainer from "./ControlContainer";
import styles from "./LanguageControl.module.css";

const LanguageControl = () => {
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom);
  const [autoDetectLanguage] = useAtom(autoDetectLanguageAtom);
  const [isLoadingLanguage] = useAtom(loadingLanguageAtom);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const languages = useMemo(
    () =>
      Object.entries(LANGUAGES).map(([key, lang]) => ({
        key,
        language: lang,
      })),
    []
  );

  const displayName = selectedLanguage
    ? `${selectedLanguage.name}${autoDetectLanguage ? " (auto)" : ""}`
    : "Auto-Detect";

  return (
    <ControlContainer title="Language">
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          className={classNames(
            styles.languageSelect,
            isLoadingLanguage && styles.loadingShimmer
          )}
          onClick={() => setOpen(!open)}
          type="button"
        >
          {displayName}
        </button>
        {open && (
          <div className={styles.dropdown}>
            <button
              className={styles.option}
              onClick={() => {
                setSelectedLanguage(null);
                setOpen(false);
              }}
              type="button"
            >
              Auto-Detect
            </button>
            {languages.map(({ key, language }) => (
              <button
                className={styles.option}
                key={key}
                onClick={() => {
                  setSelectedLanguage(language);
                  setOpen(false);
                }}
                type="button"
              >
                {language.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </ControlContainer>
  );
};

export default LanguageControl;
