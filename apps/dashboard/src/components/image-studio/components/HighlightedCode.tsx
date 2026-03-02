"use client";

import { cn } from "@notra/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  highlightedLinesAtom,
  highlighterAtom,
  loadingLanguageAtom,
} from "../store";
import { LANGUAGES, type Language } from "../util/languages";

interface PropTypes {
  selectedLanguage: Language | null;
  code: string;
}

const HighlightedCode = ({ selectedLanguage, code }: PropTypes) => {
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const highlighter = useAtomValue(highlighterAtom);
  const setIsLoadingLanguage = useSetAtom(loadingLanguageAtom);
  const highlightedLines = useAtomValue(highlightedLinesAtom);

  useEffect(() => {
    const generateHighlightedHtml = async () => {
      if (
        !highlighter ||
        !selectedLanguage ||
        selectedLanguage === LANGUAGES.plaintext
      ) {
        return code.replace(
          /[\u00A0-\u9999<>&]/g,
          (i) => `&#${i.charCodeAt(0)};`
        );
      }

      const loadedLanguages = highlighter.getLoadedLanguages() || [];
      const hasLoadedLanguage = loadedLanguages.includes(
        selectedLanguage.name.toLowerCase()
      );

      if (!hasLoadedLanguage && selectedLanguage.src) {
        setIsLoadingLanguage(true);
        await highlighter.loadLanguage(
          selectedLanguage.src as Parameters<typeof highlighter.loadLanguage>[0]
        );
        setIsLoadingLanguage(false);
      }

      let lang = selectedLanguage.name.toLowerCase();
      if (lang === "typescript") {
        lang = "tsx";
      }

      return highlighter.codeToHtml(code, {
        lang,
        theme: "css-variables",
        transformers: [
          {
            line(node, line) {
              node.properties["data-line"] = line;
              if (highlightedLines.includes(line)) {
                this.addClassToHast(node, "highlighted-line");
              }
            },
          },
        ],
      });
    };

    generateHighlightedHtml().then((newHtml) => {
      setHighlightedHtml(newHtml);
    });
  }, [
    code,
    selectedLanguage,
    highlighter,
    setIsLoadingLanguage,
    highlightedLines,
  ]);

  return (
    <div
      className={cn(
        selectedLanguage === LANGUAGES.plaintext &&
          "text-[color:var(--ray-foreground)]"
      )}
      dangerouslySetInnerHTML={{
        __html: highlightedHtml,
      }}
      data-studio-formatted=""
    />
  );
};

export default HighlightedCode;
