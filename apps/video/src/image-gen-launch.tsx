import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile } from "remotion";
import { zoomDissolve } from "./components/scene-transition";
import {
  COLORS,
  SCENE_DURATIONS,
  SLIDE_FRAMES,
  TOTAL_DURATION,
  TRANSITION_FRAMES,
} from "./lib/theme";
import { ColdOpen } from "./scenes/cold-open";
import { Designers } from "./scenes/designers";
import { EndCard } from "./scenes/end-card";
import { ExportMenu } from "./scenes/export-menu";
import { Generation } from "./scenes/generation";
import { GithubPr } from "./scenes/github-pr";
import { OnePrompt } from "./scenes/one-prompt";
import { PaperPaste } from "./scenes/paper-paste";
import { Targets } from "./scenes/targets";
import { TextEdit } from "./scenes/text-edit";

const SCENES = [
  { component: ColdOpen, duration: SCENE_DURATIONS.coldOpen, exit: "dissolve" },
  { component: GithubPr, duration: SCENE_DURATIONS.github, exit: "dissolve" },
  {
    component: OnePrompt,
    duration: SCENE_DURATIONS.onePrompt,
    exit: "dissolve",
  },
  {
    component: Generation,
    duration: SCENE_DURATIONS.generation,
    exit: "slideUp",
  },
  {
    component: Designers,
    duration: SCENE_DURATIONS.designers,
    exit: "dissolve",
  },
  {
    component: ExportMenu,
    duration: SCENE_DURATIONS.exportMenu,
    exit: "dissolve",
  },
  {
    component: PaperPaste,
    duration: SCENE_DURATIONS.paperPaste,
    exit: "dissolve",
  },
  { component: TextEdit, duration: SCENE_DURATIONS.textEdit, exit: "dissolve" },
  { component: Targets, duration: SCENE_DURATIONS.targets, exit: "dissolve" },
  { component: EndCard, duration: SCENE_DURATIONS.endCard, exit: "dissolve" },
] as const;

const FADE_OUT_FRAMES = 60;

const crossfade = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    presentation={zoomDissolve()}
    timing={linearTiming({
      durationInFrames: TRANSITION_FRAMES,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    })}
  />
);

const slideUp = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    presentation={slide({ direction: "from-bottom" })}
    timing={linearTiming({
      durationInFrames: SLIDE_FRAMES,
      easing: Easing.inOut(Easing.cubic),
    })}
  />
);

function buildSeries() {
  const items: ReactNode[] = [];

  for (const [
    index,
    { component: Scene, duration, exit },
  ] of SCENES.entries()) {
    const isLast = index === SCENES.length - 1;
    const exitFrames = exit === "slideUp" ? SLIDE_FRAMES : TRANSITION_FRAMES;
    items.push(
      <TransitionSeries.Sequence
        durationInFrames={duration + (isLast ? 0 : exitFrames)}
        key={Scene.name}
      >
        <Scene />
      </TransitionSeries.Sequence>
    );
    if (!isLast) {
      items.push(
        exit === "slideUp"
          ? slideUp(`slide-after-${Scene.name}`)
          : crossfade(`fade-after-${Scene.name}`)
      );
    }
  }

  return items;
}

export function ImageGenLaunch() {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.stage,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <TransitionSeries>{buildSeries()}</TransitionSeries>
      <Audio
        src={staticFile("120bpm-music.mp3")}
        trimBefore={12 * 30}
        volume={(frame) =>
          interpolate(
            frame,
            [0, 10, TOTAL_DURATION - FADE_OUT_FRAMES, TOTAL_DURATION],
            [0, 0.7, 0.7, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        }
      />
    </AbsoluteFill>
  );
}
