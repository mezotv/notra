"use client";

import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { THEMES, type Theme, themeAtom } from "../store/themes";
import ControlContainer from "./ControlContainer";
import styles from "./ThemeControl.module.css";

function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <span
      className={styles.themePreview}
      style={{
        backgroundImage: `linear-gradient(140deg, ${theme.background.from}, ${theme.background.to})`,
      }}
    />
  );
}

const ThemeControl = () => {
  const [currentTheme, atomSetTheme] = useAtom(themeAtom);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const setTheme = (theme: Theme) => {
    atomSetTheme(theme);
    try {
      localStorage.setItem("codeTheme", theme.id);
    } catch {
      // ignore
    }
    setOpen(false);
  };

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

  const themes = Object.values(THEMES);

  return (
    <ControlContainer title="Theme">
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          className={styles.themeSelect}
          onClick={() => setOpen(!open)}
          type="button"
        >
          <ThemePreview theme={currentTheme} />
          {currentTheme.name}
        </button>
        {open && (
          <div className={styles.dropdown}>
            {themes.map((theme) => (
              <button
                className={styles.themeOption}
                key={theme.id}
                onClick={() => setTheme(theme)}
                type="button"
              >
                <ThemePreview theme={theme} />
                {theme.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </ControlContainer>
  );
};

export default ThemeControl;
