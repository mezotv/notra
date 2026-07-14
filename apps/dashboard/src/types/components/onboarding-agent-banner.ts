export interface OnboardingAgentBannerProps {
  state: "idle" | "running";
  onStart: () => void;
  onDismiss: () => void;
  starting: boolean;
}
