import { FEEDBACK_CLASSIFIER_TITLE_MAX_LENGTH } from "@notra/ai/constants/feedback-classifier";
import {
  AGENT_FEEDBACK_KINDS,
  AGENT_FEEDBACK_SENTIMENTS,
} from "@notra/db/constants/agent-feedback";
import { z } from "zod";

export const feedbackClassificationSchema = z.object({
  sentiment: z
    .enum(AGENT_FEEDBACK_SENTIMENTS)
    .describe(
      "How the person or agent feels about the product in this feedback"
    ),
  kind: z
    .enum(AGENT_FEEDBACK_KINDS)
    .describe("What the feedback is: bug, feature, praise, question or other"),
  title: z
    .string()
    .trim()
    .min(1)
    .max(FEEDBACK_CLASSIFIER_TITLE_MAX_LENGTH)
    .describe(
      "A short, specific one-line summary of the feedback in sentence case, no trailing punctuation"
    ),
});
