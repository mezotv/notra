"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { createContext, useContext, useReducer } from "react";

import {
  commandPaletteReducer,
  createInitialCommandPaletteState,
} from "@/components/command-palette/command-palette-reducer";
import type { CommandPaletteOpenSource } from "@/types/analytics/studio-events";
import type {
  CommandPaletteContextValue,
  CommandPaletteStateAction,
} from "@/types/components/command-palette";

const CommandPaletteOpenContext = createContext<boolean | null>(null);
const CommandPaletteHasOpenedContext = createContext<boolean | null>(null);
const CommandPaletteOpenSourceContext =
  createContext<CommandPaletteOpenSource | null>(null);
const CommandPaletteDispatchContext =
  createContext<React.Dispatch<CommandPaletteStateAction> | null>(null);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ hasOpened, open, openSource }, dispatch] = useReducer(
    commandPaletteReducer,
    undefined,
    createInitialCommandPaletteState
  );
  useHotkey(
    "Mod+K",
    (event) => {
      if (!open && document.querySelector('[role="dialog"][data-open]')) {
        return;
      }
      event.preventDefault();
      dispatch({ open: !open, source: "hotkey" });
    },
    {
      enabled: true,
      ignoreInputs: false,
      preventDefault: false,
      stopPropagation: false,
    }
  );

  return (
    <CommandPaletteOpenContext.Provider value={open}>
      <CommandPaletteHasOpenedContext.Provider value={hasOpened}>
        <CommandPaletteOpenSourceContext.Provider value={openSource}>
          <CommandPaletteDispatchContext.Provider value={dispatch}>
            {children}
          </CommandPaletteDispatchContext.Provider>
        </CommandPaletteOpenSourceContext.Provider>
      </CommandPaletteHasOpenedContext.Provider>
    </CommandPaletteOpenContext.Provider>
  );
}

export function useCommandPalette() {
  const open = useContext(CommandPaletteOpenContext);
  const hasOpened = useContext(CommandPaletteHasOpenedContext);
  const openSource = useContext(CommandPaletteOpenSourceContext);
  const dispatch = useContext(CommandPaletteDispatchContext);
  if (open === null || hasOpened === null || !dispatch) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider"
    );
  }
  const setOpen: CommandPaletteContextValue["setOpen"] = (
    nextOpen,
    source: CommandPaletteOpenSource = "button"
  ) => dispatch({ open: nextOpen, source });
  return { hasOpened, open, openSource, setOpen };
}
