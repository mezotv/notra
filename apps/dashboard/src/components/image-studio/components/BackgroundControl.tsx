"use client";

import { Switch } from "@notra/ui/components/ui/switch";
import { useAtom } from "jotai";
import { showBackgroundAtom } from "../store";
import ControlContainer from "./ControlContainer";

const BackgroundControl = () => {
  const [showBackground, setShowBackground] = useAtom(showBackgroundAtom);

  return (
    <ControlContainer title="Background">
      <Switch
        checked={showBackground}
        onCheckedChange={(checked) => setShowBackground(checked)}
      />
    </ControlContainer>
  );
};

export default BackgroundControl;
