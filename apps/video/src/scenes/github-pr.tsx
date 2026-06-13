import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Cursor } from "../components/cursor";
import { interFamily } from "../lib/fonts";
import { steadyTransform } from "../lib/steady";
import { BEAT, COLORS } from "../lib/theme";

const GH = {
  text: "#1f2328",
  muted: "#59636e",
  border: "#d1d9e0",
  merged: "#8250df",
  green: "#1a7f37",
  buttonGreen: "#1f883d",
  bg: "#ffffff",
  subtle: "#f6f8fa",
  branchBg: "#ddf4ff",
  branchText: "#0969da",
  tabActive: "#fd8c73",
  counterBg: "#818b981f",
} as const;

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const STAGGER = 5;
const MERGE_AT = 6 * BEAT;
const MERGE_BUTTON = { x: 615, y: 698 };

function GithubMark({ size }: { size: number }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 1024 1024" width={size}>
      <path
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
        fill={GH.text}
        fillRule="evenodd"
        transform="scale(64)"
      />
    </svg>
  );
}

function OpenPrIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg fill={color} height={size} viewBox="0 0 16 16" width={size}>
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  );
}

function MergeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg fill={color} height={size} viewBox="0 0 16 16" width={size}>
      <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  );
}

function ChevronDownSmall({ color }: { color: string }) {
  return (
    <svg fill={color} height={14} viewBox="0 0 16 16" width={14}>
      <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
    </svg>
  );
}

function BranchChip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 6,
        background: GH.branchBg,
        color: GH.branchText,
        fontSize: 14.5,
        fontFamily: MONO,
      }}
    >
      {children}
    </span>
  );
}

interface TabProps {
  label: string;
  count?: string;
  active?: boolean;
}

const TABS: TabProps[] = [
  { label: "Conversation", count: "12", active: true },
  { label: "Commits", count: "5" },
  { label: "Checks", count: "1" },
  { label: "Files changed", count: "6" },
];

const VIEWPORT_HEIGHT = 430;
const COMMENT_HEIGHT = 300;
const SKELETON_HEIGHT = 120;
const SKELETON_GAP = 20;
const SKELETON_COUNT = 10;
const SCROLL_DISTANCE =
  COMMENT_HEIGHT +
  SKELETON_GAP +
  SKELETON_COUNT * (SKELETON_HEIGHT + SKELETON_GAP);
const SCROLL_START = 3 * BEAT;
const SCROLL_END = 4 * BEAT;
const MERGE_VIEW_HEIGHT = 268;

function Tab({ label, count, active }: TabProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderBottom: active
          ? `2px solid ${GH.tabActive}`
          : "2px solid transparent",
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: active ? 600 : 400,
          color: GH.text,
        }}
      >
        {label}
      </span>
      {count ? (
        <span
          style={{
            padding: "1px 9px",
            borderRadius: 999,
            background: GH.counterBg,
            fontSize: 13,
            color: GH.muted,
          }}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}

interface FlyInProps {
  index: number;
  children: ReactNode;
}

function FlyIn({ index, children }: FlyInProps) {
  const frame = useCurrentFrame();
  const start = 4 + index * STAGGER;
  const progress = interpolate(frame, [start, start + 14], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const blur = (1 - progress) * 7;

  return (
    <div
      style={{
        opacity: progress,
        ...steadyTransform(`translateY(${(1 - progress) * 36}px)`),
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
}

function CommentCard() {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        height: COMMENT_HEIGHT,
        marginBottom: SKELETON_GAP,
      }}
    >
      <Img
        src={staticFile("avatar-mezotv.png")}
        style={{ width: 42, height: 42, borderRadius: 21, flexShrink: 0 }}
      />
      <div
        style={{
          flex: 1,
          border: `1px solid ${GH.border}`,
          borderRadius: 10,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            background: GH.subtle,
            borderBottom: `1px solid ${GH.border}`,
            fontSize: 15,
            color: GH.muted,
          }}
        >
          <span style={{ fontWeight: 600, color: GH.text }}>mezotv</span>
          <span>commented 3 weeks ago</span>
          <span>•</span>
          <span>edited</span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              padding: "2px 12px",
              borderRadius: 999,
              border: `1px solid ${GH.border}`,
              fontSize: 13.5,
            }}
          >
            Contributor
          </span>
          <span style={{ letterSpacing: 1.5, fontWeight: 700 }}>…</span>
        </div>
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 15.5, color: GH.text, lineHeight: 1.45 }}>
            Adds a settings option to choose and preview a custom sound for
            agent event audio cues. Also allows you to preview the emdash
            default audio cue along with displaying the audio timing select
            properly
          </span>
          <span style={{ fontSize: 15.5, color: GH.text }}>Preview:</span>
          <Img
            src={staticFile("pr-preview.png")}
            style={{
              width: 540,
              borderRadius: 8,
              border: `1px solid ${GH.border}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const SKELETONS = Array.from({ length: SKELETON_COUNT }, (_, index) => ({
  id: `skeleton-${index + 1}`,
  headerWidth: 120 + ((index * 53) % 90),
  lineWidths: [55 + ((index * 37) % 38), 30 + ((index * 71) % 45)],
}));

function SkeletonComment({
  skeleton,
}: {
  skeleton: (typeof SKELETONS)[number];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        height: SKELETON_HEIGHT,
        marginBottom: SKELETON_GAP,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          background: "#e8eaed",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          border: `1px solid ${GH.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 38,
            background: GH.subtle,
            borderBottom: `1px solid ${GH.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          <div
            style={{
              width: skeleton.headerWidth,
              height: 11,
              borderRadius: 6,
              background: "#dde0e4",
            }}
          />
        </div>
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {skeleton.lineWidths.map((width, lineIndex) => (
            <div
              key={`${skeleton.id}-line-${width}-${lineIndex.toString()}`}
              style={{
                width: `${width}%`,
                height: 11,
                borderRadius: 6,
                background: "#e8eaed",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckCircleFilled({ size }: { size: number }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <circle cx={12} cy={12} fill="#1a7f37" r={12} />
      <path
        d="m7 12.5 3.2 3.2 6.8-7.4"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </svg>
  );
}

function MergeBoxRow({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
      }}
    >
      <CheckCircleFilled size={30} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: GH.text }}>
          {title}
        </span>
        <span style={{ fontSize: 15, color: GH.muted }}>{sub}</span>
      </div>
    </div>
  );
}

function MergeBox({
  merged,
  buttonDip,
  buttonOpacity,
  mergeIn,
}: {
  merged: boolean;
  buttonDip: number;
  buttonOpacity: number;
  mergeIn: number;
}) {
  const mergeBlur = (1 - mergeIn) * 6;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 9,
          background: merged ? GH.merged : "#347d39",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <MergeIcon color="#ffffff" size={21} />
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            borderRadius: 10,
            border: `1.5px solid ${merged ? GH.border : "rgba(31,136,61,0.5)"}`,
            background: GH.bg,
            overflow: "hidden",
          }}
        >
          <MergeBoxRow
            sub="1 successful check"
            title="All checks have passed"
          />
          <div style={{ height: 1, background: GH.border }} />
          <MergeBoxRow
            sub="Merging can be performed automatically."
            title="No conflicts with base branch"
          />
          <div style={{ height: 1, background: GH.border }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 18px",
              background: GH.subtle,
            }}
          >
            {merged ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flex: 1,
                  opacity: mergeIn,
                  ...steadyTransform(`translateY(${(1 - mergeIn) * 12}px)`),
                  filter: mergeBlur > 0.1 ? `blur(${mergeBlur}px)` : undefined,
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: GH.merged,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MergeIcon color="#ffffff" size={17} />
                </span>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <span
                    style={{ fontSize: 16, fontWeight: 600, color: GH.text }}
                  >
                    Pull request successfully merged and closed
                  </span>
                  <span style={{ fontSize: 14.5, color: GH.muted }}>
                    The mezotv:emdash/sweet-candies-stop-08u4t branch can be
                    safely deleted.
                  </span>
                </div>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${GH.border}`,
                    background: GH.subtle,
                    fontSize: 15,
                    fontWeight: 600,
                    color: GH.text,
                  }}
                >
                  Delete branch
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flex: 1,
                  opacity: buttonOpacity,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    transform: `scale(${buttonDip})`,
                  }}
                >
                  <span
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px 0 0 8px",
                      background: GH.buttonGreen,
                      color: "#ffffff",
                      fontSize: 15.5,
                      fontWeight: 600,
                    }}
                  >
                    Merge pull request
                  </span>
                  <span
                    style={{
                      width: 1,
                      background: "rgba(255,255,255,0.4)",
                    }}
                  />
                  <span
                    style={{
                      padding: "0 12px",
                      borderRadius: "0 8px 8px 0",
                      background: GH.buttonGreen,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronDownSmall color="#ffffff" />
                  </span>
                </span>
                <span style={{ fontSize: 14.5, color: GH.muted }}>
                  You can also merge this with the command line.{" "}
                  <span
                    style={{
                      color: GH.branchText,
                      textDecoration: "underline",
                    }}
                  >
                    View command line instructions.
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: 10,
            fontSize: 14.5,
            color: GH.muted,
          }}
        >
          <span>
            Still in progress?{" "}
            <span style={{ textDecoration: "underline" }}>
              Convert to draft
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function GithubPr() {
  const frame = useCurrentFrame();
  const merged = frame >= MERGE_AT;

  const card = interpolate(frame, [0, 16], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const boxSwapped = frame >= MERGE_AT + 4;

  const buttonDip = interpolate(
    frame,
    [MERGE_AT - 2, MERGE_AT + 2, MERGE_AT + 7],
    [1, 0.95, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const buttonOpacity = interpolate(
    frame,
    [MERGE_AT + 1, MERGE_AT + 4],
    [1, 0],
    {
      easing: Easing.in(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const mergeIn = interpolate(frame, [MERGE_AT + 4, MERGE_AT + 18], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgePop = interpolate(
    frame,
    [MERGE_AT, MERGE_AT + 5, MERGE_AT + 13],
    [1, 1.12, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const badgeBlur = merged ? (1 - mergeIn) * 5 : 0;

  const scrollProgress = interpolate(
    frame,
    [SCROLL_START, SCROLL_END],
    [0, 1],
    {
      easing: Easing.bezier(0.85, 0, 0.15, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const scrollY = scrollProgress * SCROLL_DISTANCE;
  const scrollBlur = Math.sin(scrollProgress * Math.PI) * 14;
  const scrollFade = scrollBlur * 3;
  const scrollFadeMask =
    scrollFade > 0.5
      ? `linear-gradient(to bottom, transparent 0px, #000000 ${scrollFade}px, #000000 calc(100% - ${scrollFade}px), transparent 100%)`
      : undefined;

  const viewportHeight = interpolate(
    frame,
    [3 * BEAT, 4 * BEAT],
    [VIEWPORT_HEIGHT, MERGE_VIEW_HEIGHT],
    {
      easing: Easing.bezier(0.45, 0, 0.15, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        fontFamily: interFamily,
      }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 1160,
            borderRadius: 16,
            background: GH.bg,
            border: `1px solid ${GH.border}`,
            boxShadow: "0 30px 80px -20px rgba(30,30,30,0.22)",
            padding: "36px 44px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            opacity: card,
            transform: `scale(${0.96 + 0.04 * card})`,
          }}
        >
          <FlyIn index={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <GithubMark size={34} />
              <span style={{ fontSize: 22, color: GH.muted }}>
                generalaction /{" "}
                <span style={{ fontWeight: 600, color: GH.text }}>emdash</span>
              </span>
            </div>
          </FlyIn>
          <FlyIn index={1}>
            <span
              style={{
                fontSize: 38,
                fontWeight: 400,
                color: GH.text,
                letterSpacing: -0.5,
              }}
            >
              feat(settings): add custom notification sound{" "}
              <span style={{ color: GH.muted, fontWeight: 300 }}>#2085</span>
            </span>
          </FlyIn>
          <FlyIn index={2}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 16px",
                  borderRadius: 999,
                  background: merged ? GH.merged : GH.buttonGreen,
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 600,
                  transform: `scale(${badgePop})`,
                  filter: badgeBlur > 0.1 ? `blur(${badgeBlur}px)` : undefined,
                }}
              >
                {merged ? (
                  <MergeIcon color="#ffffff" size={16} />
                ) : (
                  <OpenPrIcon color="#ffffff" size={16} />
                )}
                {merged ? "Merged" : "Open"}
              </span>
              <span style={{ fontSize: 16, color: GH.muted }}>
                {merged ? (
                  <>
                    <span style={{ fontWeight: 600, color: GH.text }}>
                      arnestrickmann
                    </span>{" "}
                    merged 5 commits into
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 600, color: GH.text }}>
                      mezotv
                    </span>{" "}
                    wants to merge 5 commits into
                  </>
                )}{" "}
                <BranchChip>generalaction:main</BranchChip> from{" "}
                <BranchChip>mezotv:emdash/sweet-candies-stop-08u4t</BranchChip>
              </span>
            </div>
          </FlyIn>
          <FlyIn index={3}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${GH.border}`,
              }}
            >
              {TABS.map((tab) => (
                <Tab
                  active={tab.active}
                  count={tab.count}
                  key={tab.label}
                  label={tab.label}
                />
              ))}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: GH.green }}>
                +325
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#cf222e",
                  marginLeft: 8,
                }}
              >
                −26
              </span>
            </div>
          </FlyIn>
          <FlyIn index={4}>
            <div
              style={{
                height: viewportHeight,
                overflow: "hidden",
                clipPath: "inset(0)",
                margin: "0 -40px",
                padding: "0 40px",
                maskImage: scrollFadeMask,
                WebkitMaskImage: scrollFadeMask,
              }}
            >
              <div
                style={{
                  ...steadyTransform(`translateY(${-scrollY}px)`),
                  filter:
                    scrollBlur > 0.1 ? `blur(${scrollBlur}px)` : undefined,
                }}
              >
                <CommentCard />
                {SKELETONS.map((skeleton) => (
                  <SkeletonComment key={skeleton.id} skeleton={skeleton} />
                ))}
                <div style={{ minHeight: VIEWPORT_HEIGHT }}>
                  <MergeBox
                    buttonDip={buttonDip}
                    buttonOpacity={buttonOpacity}
                    merged={boxSwapped}
                    mergeIn={mergeIn}
                  />
                </div>
              </div>
            </div>
          </FlyIn>
        </div>
        <Cursor
          clickFrames={[MERGE_AT]}
          keyframes={[
            { frame: 64, x: 1980, y: 1110 },
            { frame: 69, x: 1020, y: 810 },
            { frame: 71, x: 830, y: 700 },
            { frame: 73, x: 920, y: 535 },
            { frame: 75, x: 1100, y: 495 },
            { frame: 78, x: 1165, y: 655 },
            { frame: 82, x: 955, y: 778 },
            { frame: 88, x: MERGE_BUTTON.x, y: MERGE_BUTTON.y },
            { frame: MERGE_AT + 10, x: MERGE_BUTTON.x, y: MERGE_BUTTON.y },
            { frame: MERGE_AT + 30, x: 1180, y: 950 },
          ]}
          size={52}
          variantKeyframes={[
            { frame: 85, variant: "handpointing" },
            { frame: MERGE_AT + 12, variant: "default" },
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
