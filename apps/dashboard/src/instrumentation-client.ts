import posthog from "posthog-js";
import { POSTHOG_CONFIG, POSTHOG_PROJECT_TOKEN } from "@/constants/posthog";

if (POSTHOG_PROJECT_TOKEN) {
  posthog.init(POSTHOG_PROJECT_TOKEN, POSTHOG_CONFIG);
}
