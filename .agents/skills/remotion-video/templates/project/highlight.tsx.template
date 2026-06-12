import type { CSSProperties } from "react";
import { brand } from "./brand";

/**
 * Renders inline text with `**bold**` runs highlighted in the primary color.
 * Use in captions / headlines to draw the eye to key words.
 */
export const Highlight: React.FC<{
  text: string;
  style?: CSSProperties;
}> = ({ text, style }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span key={i} style={{ color: brand.colors.primary, fontWeight: 900 }}>
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export default Highlight;
