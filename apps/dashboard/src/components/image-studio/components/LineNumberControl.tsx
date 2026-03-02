"use client";

import { Switch } from "@notra/ui/components/ui/switch";
import { useAtomValue, useSetAtom } from "jotai";
import { showLineNumbersAtom } from "../store";
import { themeAtom, themeLineNumbersAtom } from "../store/themes";
import ControlContainer from "./ControlContainer";

const LineNumberControl = () => {
  const theme = useAtomValue(themeAtom);
  const showLineNumbers = useAtomValue(themeLineNumbersAtom);
  const setShowLineNumbers = useSetAtom(showLineNumbersAtom);
  const isDisabled = theme.partner && !theme.lineNumbersToggleable;

  return (
    <ControlContainer title="Line numbers">
      <Switch
        checked={showLineNumbers}
        disabled={!!isDisabled}
        onCheckedChange={(checked) => setShowLineNumbers(checked)}
      />
    </ControlContainer>
  );
};

export default LineNumberControl;
