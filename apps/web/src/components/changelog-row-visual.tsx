import { NotraMark } from "@/components/notra-mark";
import { CHANGELOG_ACCENT_GRADIENT } from "@/constants/changelog";
import type { ChangelogRowVisualProps } from "~types/changelog";

export function ChangelogRowVisual({
  gradient,
  index,
}: ChangelogRowVisualProps) {
  const isDark = index % 4 === 1;

  return (
    <div
      className="flex h-28 w-full shrink-0 items-center justify-center overflow-clip sm:h-auto sm:w-64"
      style={{ backgroundImage: gradient }}
    >
      <div
        className="flex flex-col items-center gap-2.25 rounded-xl bg-white px-4.5 py-4"
        style={{ boxShadow: "#28282820 0px 10px 24px -8px" }}
      >
        <NotraMark className="size-6 shrink-0" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4.5 w-30 rounded-md ring-1 ring-[#E4E4E4]" />
          <div className="h-4.5 w-30 rounded-md ring-1 ring-[#E4E4E4]" />
          <div
            className="h-4.5 w-30 rounded-[0.5625rem]"
            style={{
              backgroundImage: isDark
                ? CHANGELOG_ACCENT_GRADIENT
                : "linear-gradient(in oklab 180deg, oklab(66.5% 0.077 -0.169) 0%, oklab(54.1% 0.096 -0.227) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
