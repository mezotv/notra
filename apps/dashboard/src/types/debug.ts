import type { EveMessagePart } from "eve/react";

export interface EveMessagePartProps {
  part: EveMessagePart;
  onRespond: (requestId: string, optionId: string) => void;
}
