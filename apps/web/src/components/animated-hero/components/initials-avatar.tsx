import { interFamily } from "../lib/fonts";

interface InitialsAvatarProps {
  name: string;
  accent: string;
  size: number;
}

const WHITESPACE = /\s+/;

function initialsFor(name: string): string {
  const parts = name.trim().split(WHITESPACE);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export function InitialsAvatar({ name, accent, size }: InitialsAvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: `linear-gradient(160deg, ${accent} 0%, ${accent}cc 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: interFamily,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: "#ffffff",
        letterSpacing: 0.3,
      }}
    >
      {initialsFor(name)}
    </div>
  );
}
