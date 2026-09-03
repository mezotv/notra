"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { CommandPaletteOpenSource } from "@/types/analytics/studio-events";
import type { CommandPaletteContextValue } from "@/types/components/command-palette";

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [openSource, setOpenSource] = useState<CommandPaletteOpenSource | null>(
    null
  );
  const updateOpen = useCallback(
    (nextOpen: boolean, source: CommandPaletteOpenSource = "button") => {
      setOpen(nextOpen);
      if (nextOpen) {
        setHasOpened(true);
      }
      setOpenSource(nextOpen ? source : null);
    },
    []
  );
  useHotkey(
    "Mod+K",
    (event) => {
      if (!open && document.querySelector('[role="dialog"][data-open]')) {
        return;
      }
      event.preventDefault();
      updateOpen(!open, "hotkey");
    },
    {
      enabled: true,
      ignoreInputs: false,
      preventDefault: false,
      stopPropagation: false,
    }
  );

  const value = useMemo(
    () => ({ hasOpened, open, openSource, setOpen: updateOpen }),
    [hasOpened, open, openSource, updateOpen]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider"
    );
  }
  return context;
}
