"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useEffect } from "react";

interface SelectionPluginProps {
  onSelectionChange: (selectedText: string | null) => void;
}

export function SelectionPlugin({ onSelectionChange }: SelectionPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          const text = selection.getTextContent().trim();
          onSelectionChange(text || null);
        } else {
          onSelectionChange(null);
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    // Only capture native selections that are inside the editor root
    const handleNativeSelection = () => {
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();
      const anchorNode = nativeSelection?.anchorNode ?? null;
      const isInsideEditor =
        rootElement && anchorNode ? rootElement.contains(anchorNode) : false;

      if (!(nativeSelection && isInsideEditor) || nativeSelection.isCollapsed) {
        onSelectionChange(null);
        return;
      }

      const text = nativeSelection.toString().trim();
      onSelectionChange(text || null);
    };

    document.addEventListener("selectionchange", handleNativeSelection);

    return () => {
      unregister();
      document.removeEventListener("selectionchange", handleNativeSelection);
    };
  }, [editor, onSelectionChange]);

  return null;
}
