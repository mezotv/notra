import type * as React from "react";
import { cn } from "@notra/ui/lib/utils";

const ROSE = "#cd694a";
const GRAY = "#949494";

const LOGO_BITS = [
  "000111111111111000",
  "000110111111011000",
  "011111111111111110",
  "000111111111111000",
  "000010100001010000",
];

const LOGO_PIXEL_HEIGHT = 2.4;

export function ClaudeLogo({
  scale = 4,
  color = ROSE,
  className,
}: {
  scale?: number;
  color?: string;
  className?: string;
}) {
  const w = LOGO_BITS[0]?.length ?? 0;
  const h = LOGO_BITS.length;
  const rects: React.ReactElement[] = [];
  for (const [y, row] of LOGO_BITS.entries()) {
    let x = 0;
    while (x < w) {
      if (row[x] === "1") {
        let end = x;
        while (end < w && row[end] === "1") {
          end += 1;
        }
        rects.push(
          <rect
            height={LOGO_PIXEL_HEIGHT}
            key={`${x}-${y}`}
            width={end - x}
            x={x}
            y={y * LOGO_PIXEL_HEIGHT}
          />
        );
        x = end;
      } else {
        x += 1;
      }
    }
  }
  return (
    <svg
      aria-hidden
      className={className}
      fill={color}
      height={h * LOGO_PIXEL_HEIGHT * scale}
      shapeRendering="crispEdges"
      viewBox={`0 0 ${w} ${h * LOGO_PIXEL_HEIGHT}`}
      width={w * scale}
    >
      {rects}
    </svg>
  );
}

export function ClaudeHeader({
  version = "v2.1.206",
  user = "Ben",
  model = "Fable 5 with xhigh effort · Claude Max",
  org = "ben@freestyle.sh's Organization",
  cwd = "~/dev/brainless",
  tips = ["Ask Claude to create a new app or clone a repo"],
  whatsNew = [
    "Added directory path suggestions to /cd",
    "Added a /doctor check that proposes trims",
  ],
  className,
}: {
  version?: string;
  user?: string;
  model?: string;
  org?: string;
  cwd?: string;
  tips?: string[];
  whatsNew?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-[6px] border px-3 pt-4 pb-3.5 font-mono text-[#c0caf5] text-[13px] leading-[1.5] sm:px-4",
        className
      )}
      style={{ borderColor: ROSE }}
    >
      <div
        className="-top-2.5 absolute left-3 max-w-[calc(100%-1.5rem)] truncate bg-[#1E1E1E] px-2"
        style={{ color: ROSE }}
      >
        Claude Code <span style={{ color: GRAY }}>{version}</span>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col items-center gap-2 py-1 text-center">
          <div className="font-semibold">Welcome back {user}!</div>
          <ClaudeLogo className="my-1.5" />
          <div
            className="min-w-0 space-y-0.5 break-words"
            style={{ color: GRAY }}
          >
            <div>{model}</div>
            <div>{org}</div>
            <div>{cwd}</div>
          </div>
        </div>

        <div
          aria-hidden
          className="hidden sm:block"
          style={{ background: `${ROSE}55` }}
        />

        <div className="min-w-0 space-y-1">
          <div className="font-semibold" style={{ color: ROSE }}>
            Tips for getting started
          </div>
          {tips.map((t) => (
            <div className="truncate" key={t}>
              {t}
            </div>
          ))}
          <div className="my-1.5 h-px" style={{ background: ROSE }} />
          <div className="font-semibold" style={{ color: ROSE }}>
            What&apos;s new
          </div>
          {whatsNew.map((t) => (
            <div className="truncate" key={t}>
              {t}
            </div>
          ))}
          <div className="truncate italic" style={{ color: GRAY }}>
            /release-notes for more
          </div>
        </div>
      </div>
    </div>
  );
}
