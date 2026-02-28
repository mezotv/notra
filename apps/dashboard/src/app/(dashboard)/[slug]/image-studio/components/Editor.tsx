"use client";

import classNames from "classnames";
import { useAtom, useSetAtom } from "jotai";
import {
  type ChangeEventHandler,
  type CSSProperties,
  type FocusEventHandler,
  type KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { highlightedLinesAtom } from "../store";
import {
  codeAtom,
  isCodeExampleAtom,
  selectedLanguageAtom,
} from "../store/code";
import {
  themeCSSAtom,
  themeFontAtom,
  themeLineNumbersAtom,
} from "../store/themes";
import { LANGUAGES } from "../util/languages";
import styles from "./Editor.module.css";
import HighlightedCode from "./HighlightedCode";

const DEDENT_REGEX = /^\s\s/;
const INDENTATION_REGEX = /^(\s+)/;
const BRACKET_OPEN_REGEX = /([{[:>])$/;
const BRACKET_CLOSE_REGEX = /^\s{2,}$/;
const NEWLINE_REGEX = /\n/g;

function indentText(text: string) {
  return text
    .split("\n")
    .map((str) => `  ${str}`)
    .join("\n");
}

function dedentText(text: string) {
  return text
    .split("\n")
    .map((str) => str.replace(DEDENT_REGEX, ""))
    .join("\n");
}

function getCurrentlySelectedLine(textarea: HTMLTextAreaElement) {
  const original = textarea.value;
  const selectionStart = textarea.selectionStart;
  const beforeStart = original.slice(0, selectionStart);

  return original
    .slice(
      beforeStart.lastIndexOf("\n") !== -1
        ? beforeStart.lastIndexOf("\n") + 1
        : 0
    )
    .split("\n")[0] ?? "";
}

function handleTab(textarea: HTMLTextAreaElement, shiftKey: boolean) {
  const original = textarea.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const beforeStart = original.slice(0, start);
  const currentLine = getCurrentlySelectedLine(textarea);

  if (start === end) {
    if (shiftKey) {
      const newStart = beforeStart.lastIndexOf("\n") + 1;
      textarea.setSelectionRange(newStart, end);
      document.execCommand(
        "insertText",
        false,
        dedentText(original.slice(newStart, end))
      );
    } else {
      document.execCommand("insertText", false, "  ");
    }
  } else {
    const newStart = beforeStart.lastIndexOf("\n") + 1 || 0;
    textarea.setSelectionRange(newStart, end);

    if (shiftKey) {
      const newText = dedentText(original.slice(newStart, end));
      document.execCommand("insertText", false, newText);
      if (currentLine.startsWith("  ")) {
        textarea.setSelectionRange(start - 2, start - 2 + newText.length);
      } else {
        textarea.setSelectionRange(start, start + newText.length);
      }
    } else {
      const newText = indentText(original.slice(newStart, end));
      document.execCommand("insertText", false, newText);
      textarea.setSelectionRange(start + 2, start + 2 + newText.length);
    }
  }
}

function handleEnter(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentlySelectedLine(textarea);
  const currentIndentationMatch = currentLine.match(INDENTATION_REGEX);
  let wantedIndentation = currentIndentationMatch
    ? currentIndentationMatch[0]
    : "";

  if (currentLine.match(BRACKET_OPEN_REGEX)) {
    wantedIndentation += "  ";
  }

  document.execCommand("insertText", false, `\n${wantedIndentation}`);
}

function handleBracketClose(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentlySelectedLine(textarea);
  const { selectionStart, selectionEnd } = textarea;

  if (
    selectionStart === selectionEnd &&
    currentLine.match(BRACKET_CLOSE_REGEX)
  ) {
    textarea.setSelectionRange(selectionStart - 2, selectionEnd);
  }

  document.execCommand("insertText", false, "}");
}

const fontMap = {
  "jetbrains-mono": styles.jetBrainsMono,
  "geist-mono": styles.geistMono,
  "ibm-plex-mono": styles.ibmPlexMono,
  "fira-code": styles.firaCode,
  "roboto-mono": styles.robotoMono,
  "space-mono": styles.spaceMono,
  "source-code-pro": styles.sourceCodePro,
} as const;

function Editor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useAtom(codeAtom);
  const [selectedLanguage] = useAtom(selectedLanguageAtom);
  const [themeCSS] = useAtom(themeCSSAtom);
  const [isCodeExample] = useAtom(isCodeExampleAtom);
  const [themeFont] = useAtom(themeFontAtom);
  const setHighlightedLines = useSetAtom(highlightedLinesAtom);
  const [isHighlightingLines, setIsHighlightingLines] = useState(false);
  const [showLineNumbers] = useAtom(themeLineNumbersAtom);
  const numberOfLines = (code.match(NEWLINE_REGEX) || []).length;

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLTextAreaElement>>(
    (event) => {
      const textarea = textareaRef.current!;
      switch (event.key) {
        case "Tab":
          event.preventDefault();
          handleTab(textarea, event.shiftKey);
          break;
        case "}":
          event?.preventDefault();
          handleBracketClose(textarea);
          break;
        case "Escape":
          event.preventDefault();
          textarea.blur();
          break;
        case "Enter":
          event.preventDefault();
          handleEnter(textarea);
          break;
        default:
          break;
      }
    },
    []
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    (event) => {
      setCode(event.target.value);
    },
    [setCode]
  );

  const handleFocus = useCallback<FocusEventHandler>(() => {
    if (isCodeExample && textareaRef.current) {
      const textarea = textareaRef.current;
      setTimeout(() => {
        textarea.select();
      }, 1);
    }
  }, [isCodeExample]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const lineNumber = (target.closest("[data-line]") as HTMLElement)?.dataset
        ?.line;
      if (lineNumber && isHighlightingLines) {
        setHighlightedLines((prev) => {
          const line = Number(lineNumber);
          if (prev.includes(line)) {
            return prev.filter((l) => l !== line);
          }
          return [...prev, line];
        });
      }
    };

    document.addEventListener("click", listener);
    return () => {
      document.removeEventListener("click", listener);
    };
  }, [setHighlightedLines, isHighlightingLines]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsHighlightingLines(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsHighlightingLines(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      className={classNames(
        styles.editor,
        themeFont
          ? fontMap[themeFont as keyof typeof fontMap]
          : styles.jetBrainsMono,
        isHighlightingLines && styles.isHighlightingLines,
        showLineNumbers &&
          selectedLanguage !== LANGUAGES.plaintext && [
            styles.showLineNumbers,
            numberOfLines > 8 && styles.showLineNumbersLarge,
          ]
      )}
      data-value={code}
      style={{ "--editor-padding": "16px", ...themeCSS } as CSSProperties}
    >
      <textarea
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={styles.textarea}
        data-enable-grammarly="false"
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        ref={textareaRef}
        rows={1}
        spellCheck={false}
        tabIndex={-1}
        value={code}
      />
      <HighlightedCode code={code} selectedLanguage={selectedLanguage} />
    </div>
  );
}

export default Editor;
