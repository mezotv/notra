"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useAtom } from "jotai";
import { THEMES, type Theme, themeAtom } from "../store/themes";
import ControlContainer from "./ControlContainer";

function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundImage: `linear-gradient(140deg, ${theme.background.from}, ${theme.background.to})`,
      }}
    />
  );
}

const ThemeControl = () => {
  const [currentTheme, atomSetTheme] = useAtom(themeAtom);

  const setTheme = (theme: Theme) => {
    atomSetTheme(theme);
    try {
      localStorage.setItem("codeTheme", theme.id);
    } catch {
      // ignore
    }
  };

  const themes = Object.values(THEMES);

  return (
    <ControlContainer title="Theme">
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-muted px-2 py-1 font-medium text-foreground text-xs transition-colors hover:bg-muted/80">
          <ThemePreview theme={currentTheme} />
          {currentTheme.name}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-h-72 overflow-y-auto"
          side="top"
          sideOffset={8}
        >
          {themes.map((theme) => (
            <DropdownMenuItem key={theme.id} onClick={() => setTheme(theme)}>
              <ThemePreview theme={theme} />
              {theme.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ControlContainer>
  );
};

export default ThemeControl;
