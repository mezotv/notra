import { ANALYSIS_STEPS, FULL_URL_REGEX } from "../constants/brand-identity";
import type { StepIconState } from "../types/brand-identity";

export function getStepperValue(status: string, currentStep: number): string {
  if (status === "idle" || status === "failed") {
    return "";
  }
  if (status === "completed") {
    return "saving";
  }
  const stepIndex = Math.max(0, currentStep - 1);
  return ANALYSIS_STEPS[stepIndex]?.value ?? ANALYSIS_STEPS[0]?.value ?? "";
}

export function getModalTitle(
  isPendingSettings: boolean,
  isAnalyzing: boolean,
  status: string
): string {
  if (isPendingSettings) {
    return "Loading...";
  }
  if (isAnalyzing) {
    return "Analyzing Website";
  }
  if (status === "failed") {
    return "Analysis Failed";
  }
  return "Add Your Brand";
}

export function getModalDescription(
  isPendingSettings: boolean,
  isAnalyzing: boolean,
  status: string,
  error?: string
): string {
  if (isPendingSettings) {
    return "Checking your brand settings";
  }
  if (isAnalyzing) {
    return "Please wait while we extract your brand information";
  }
  if (status === "failed") {
    return error ?? "Something went wrong";
  }
  return "Enter your website URL to automatically extract your brand identity";
}

export const sanitizeBrandUrlInput = (value: string) =>
  value.trim().replace(FULL_URL_REGEX, "");

export const getBrandFaviconUrl = (websiteUrl: string | null) => {
  if (!websiteUrl) {
    return undefined;
  }

  const normalizedUrl = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;

  try {
    const hostname = new URL(normalizedUrl).hostname;
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return undefined;
  }
};

export const getWebsiteDisplayText = (websiteUrl: string | null) => {
  if (!websiteUrl) {
    return "";
  }

  const normalizedUrl = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;

  try {
    return new URL(normalizedUrl).hostname;
  } catch {
    return sanitizeBrandUrlInput(websiteUrl);
  }
};

export function getStepIconState(
  currentStep: number,
  stepNumber: number
): StepIconState {
  if (currentStep < stepNumber) {
    return "pending";
  }
  if (currentStep > stepNumber) {
    return "completed";
  }
  return "active";
}
