"use client";

import { Button } from "@notra/ui/components/ui/button";
import { ButtonGroup } from "@notra/ui/components/ui/button-group";
import { useAtom } from "jotai";
import { isPadding, PADDING_OPTIONS, paddingAtom } from "../store/padding";
import ControlContainer from "./ControlContainer";

const PaddingControl = () => {
  const [padding, setPadding] = useAtom(paddingAtom);

  return (
    <ControlContainer title="Padding">
      <ButtonGroup aria-label="Frame Padding">
        {PADDING_OPTIONS.map((paddingOption) => (
          <Button
            aria-pressed={padding === paddingOption}
            key={paddingOption}
            onClick={() => {
              if (isPadding(paddingOption)) {
                setPadding(paddingOption);
              }
            }}
            size="xs"
            variant={padding === paddingOption ? "secondary" : "ghost"}
          >
            {paddingOption}
          </Button>
        ))}
      </ButtonGroup>
    </ControlContainer>
  );
};

export default PaddingControl;
