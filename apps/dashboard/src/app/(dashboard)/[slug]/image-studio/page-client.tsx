"use client";

import type { HighlighterCore, LanguageInput } from "@shikijs/core";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import "@/components/image-studio/image-studio.css";
import Controls from "@/components/image-studio/components/Controls";
import ExportButton from "@/components/image-studio/components/ExportButton";
import Frame from "@/components/image-studio/components/Frame";
import NoSSR from "@/components/image-studio/components/NoSSR";
import { highlighterAtom } from "@/components/image-studio/store";
import FrameContextStore from "@/components/image-studio/store/FrameContextStore";
import { shikiTheme } from "@/components/image-studio/store/themes";
import { LANGUAGES } from "@/components/image-studio/util/languages";
import { PageContainer } from "@/components/layout/container";

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
      <PageContainer className="relative flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="font-bold text-3xl tracking-tight">
                Image Studio
              </h1>
              <p className="text-muted-foreground">
                Create beautiful code screenshots to share with the world.
              </p>
            </div>
            <ExportButton />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto">
          <NoSSR>{highlighter && <Frame />}</NoSSR>
        </div>
        <Controls />
      </PageContainer>
    </FrameContextStore>
  );
}
