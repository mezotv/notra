import type { Brand } from "./brand";

export type AspectRatio = "16:9" | "1:1" | "9:16";

export type Story = {
  meta: {
    aspectRatio: AspectRatio;
    fps: 30;
    slug: string;
  };
  brand: Brand;
  scenes: [Scene, ...Scene[]];
};

/**
 * One side of a side-by-side comparison (e.g. the "before" or "after" panel
 * of a `BeforeAfter` scene, or any surface that renders either a label or a
 * code block).
 *
 * `errorLines` (1-indexed): lines the Panel should render in the brand's
 * danger color regardless of the Shiki theme. Use this for TypeScript
 * diagnostic comments (`// TS2322 ...`, `// ~~~~~~~~~~~~~`) so the error
 * reads as an error instead of blending with Shiki's muted comment style.
 */
export type SceneContent =
  | { label: string; code?: never; language?: never; errorLines?: readonly number[] }
  | { label: string; code: string; language: string; errorLines?: readonly number[] };

export type Metric = {
  label: string;
  value: string;
};

export type HookVisual = "pattern-interrupt" | "curiosity-gap" | "social-proof";

export type Library = { name: string; importLine: string };

export type Scene =
  | {
      type: "HookTitle";
      durationFrames: number;
      text: string;
      visual: HookVisual;
    }
  | {
      type: "ProblemSetup";
      durationFrames: number;
      text: string;
      visualBeats: [string, ...string[]];
    }
  | {
      type: "CodeSnippet";
      durationFrames: number;
      language: string;
      code: string;
      /**
       * Static emphasis: these lines stay highlighted for the whole scene.
       * Ignored when `chapters` is provided. Prefer `chapters` for any scene
       * longer than ~3 seconds so the viewer gets guided through the code.
       */
      emphasizedLines?: readonly number[];
      /**
       * Default caption shown when no chapter overrides it.
       */
      caption?: string;
      /**
       * Story-driven emphasis. The scene cycles through chapters based on
       * elapsed frames; lines outside the current chapter's `lines` dim to
       * ~0.22 opacity with a slight blur, transitioning over 700ms. The
       * current chapter's `caption` (if set) overrides the scene caption.
       *
       * Sum of chapter `durationFrames` should match the scene's
       * `durationFrames`. Extra frames hold on the last chapter.
       *
       * Rule of thumb: give each chapter ~3 seconds (90 frames at 30fps) so
       * the viewer actually has time to read. 1–2 seconds per chapter feels
       * rushed.
       */
      chapters?: readonly {
        lines: readonly number[];
        caption?: string;
        durationFrames: number;
      }[];
    }
  | {
      type: "LibrarySwap";
      durationFrames: number;
      sharedCode: string;
      libraries: [Library, ...Library[]];
      caption?: string;
    }
  | {
      type: "BeforeAfter";
      durationFrames: number;
      before: SceneContent;
      after: SceneContent;
      caption?: string;
      /**
       * Story-driven emphasis for side-by-side comparisons. The scene cycles
       * through chapters based on elapsed frames. `focus` controls which
       * panel(s) get full opacity (others dim + blur); optional
       * `beforeLines` / `afterLines` trigger per-line emphasis within the
       * focused panel's code.
       *
       * Sum of `durationFrames` across chapters should equal the scene's
       * `durationFrames` (extra frames hold on the last chapter). Aim for
       * ~3 seconds (90 frames at 30fps) per chapter so viewers can read.
       *
       * Note: the viewer sees a 600ms cross-fade on panel focus changes and
       * a 700ms opacity/blur transition on per-line emphasis changes.
       */
      chapters?: readonly {
        focus: "before" | "after" | "both";
        caption?: string;
        beforeLines?: readonly number[];
        afterLines?: readonly number[];
        durationFrames: number;
      }[];
    }
  | {
      type: "MetricCompare";
      durationFrames: number;
      before: Metric;
      after: Metric;
      caption?: string;
    }
  | {
      type: "BulletList";
      durationFrames: number;
      items: [string, ...string[]];
      caption?: string;
    }
  | {
      type: "CTAEndScreen";
      durationFrames: number;
      headline: string;
      actionVerb: string;
      url?: string;
    }
  | {
      /**
       * UIShowcase — shows the product's user-visible surface alongside a
       * short caption. Research on product-launch video: "show the product
       * in action" is the single strongest predictor of viewer recall.
       *
       * Use exactly one of:
       * - `mediaSrc`: path (or public URL) of a screenshot or short video
       *   clip of the real UI. Images render as a still; `.mp4`/`.webm`
       *   render through Remotion's `<Video>`.
       * - `mockComponent`: name of a Custom scene-style React component
       *   rendered inside the frame (for hand-built mock UIs).
       *
       * `calloutBoxes` overlay brand-primary-tinted call-out rectangles
       * with optional labels that spring-enter on a staggered timeline.
       * Use them to direct the viewer to the specific part of the UI that
       * demonstrates the feature.
       */
      type: "UIShowcase";
      durationFrames: number;
      caption?: string;
      mediaSrc?: string;
      mockComponent?: string;
      calloutBoxes?: readonly {
        x: number;
        y: number;
        width: number;
        height: number;
        label?: string;
        appearAt: number;
      }[];
    }
  | {
      type: "Custom";
      durationFrames: number;
      componentName: string;
      props: Record<string, unknown>;
    };

export type SceneOfType<T extends Scene["type"]> = Extract<Scene, { type: T }>;
export type SceneProps<T extends Scene["type"]> = Omit<SceneOfType<T>, "type">;

export type { Brand } from "./brand";
