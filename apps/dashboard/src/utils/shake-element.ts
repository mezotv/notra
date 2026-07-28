const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-0.5rem)" },
  { transform: "translateX(0.4rem)" },
  { transform: "translateX(-0.3rem)" },
  { transform: "translateX(0.2rem)" },
  { transform: "translateX(-0.1rem)" },
  { transform: "translateX(0)" },
];

const SHAKE_DURATION_MS = 450;

export function shakeElements(selector: string) {
  for (const element of document.querySelectorAll(selector)) {
    if (element instanceof HTMLElement) {
      element.animate(SHAKE_KEYFRAMES, {
        duration: SHAKE_DURATION_MS,
        easing: "ease-in-out",
      });
    }
  }
}
