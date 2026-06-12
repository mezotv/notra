import { TextSlide } from "../components/text-slide";
import { COPY } from "../lib/copy";

export function Designers() {
  return (
    <TextSlide
      accent="designers"
      sub={COPY.designersSub}
      title={COPY.designersTitle}
    />
  );
}
