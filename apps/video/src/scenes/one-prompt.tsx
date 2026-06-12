import { TextSlide } from "../components/text-slide";
import { COPY } from "../lib/copy";

export function OnePrompt() {
  return (
    <TextSlide
      accent="merged"
      entrance="fold"
      foldTo={COPY.onePromptSub}
      foldToUnderline="your"
      title={COPY.onePromptTitle}
    />
  );
}
