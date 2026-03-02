"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { loadingLanguageAtom } from "../store";
import { autoDetectLanguageAtom, selectedLanguageAtom } from "../store/code";
import { LANGUAGES } from "../util/languages";
import ControlContainer from "./ControlContainer";

const LanguageControl = () => {
  const [selectedLanguage, setSelectedLanguage] = useAtom(selectedLanguageAtom);
  const [autoDetectLanguage] = useAtom(autoDetectLanguageAtom);
  const [isLoadingLanguage] = useAtom(loadingLanguageAtom);

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
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-muted px-2 py-1 font-medium text-foreground text-xs transition-colors hover:bg-muted/80 data-[loading]:animate-pulse"
          data-loading={isLoadingLanguage || undefined}
        >
          {displayName}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-h-72 overflow-y-auto"
          side="top"
          sideOffset={8}
        >
          <DropdownMenuItem onClick={() => setSelectedLanguage(null)}>
            Auto-Detect
          </DropdownMenuItem>
          {languages.map(({ key, language }) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setSelectedLanguage(language)}
            >
              {language.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ControlContainer>
  );
};

export default LanguageControl;
