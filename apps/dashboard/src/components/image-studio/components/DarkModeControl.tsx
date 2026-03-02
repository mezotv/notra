"use client";

import { Switch } from "@notra/ui/components/ui/switch";
import { useAtomValue, useSetAtom } from "jotai";
import { darkModeAtom, themeAtom, themeDarkModeAtom } from "../store/themes";
import ControlContainer from "./ControlContainer";

const DarkModeControl = () => {
  const darkMode = useAtomValue(themeDarkModeAtom);
  const setDarkMode = useSetAtom(darkModeAtom);
  const theme = useAtomValue(themeAtom);

  const hasLightMode = !!theme.syntax.light;
  const hasDarkMode = !!theme.syntax.dark;
  const canToggle = hasLightMode && hasDarkMode;

  return (
    <ControlContainer title="Dark mode">
      <Switch
        checked={darkMode}
        disabled={!canToggle}
        onCheckedChange={(checked) => setDarkMode(checked)}
      />
    </ControlContainer>
  );
};

export default DarkModeControl;
