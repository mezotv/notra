import type { PostHogConfig } from "posthog-js";

import {
  redactPostHogEvent,
  redactPostHogNetworkRequest,
} from "@/utils/posthog";

export const POSTHOG_PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

export const POSTHOG_CONFIG = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  autocapture: false,
  before_send: redactPostHogEvent,
  capture_pageleave: false,
  capture_pageview: false,
  defaults: "2026-05-30",
  disable_capture_url_hashes: true,
  disable_session_recording: false,
  enable_recording_console_log: false,
  save_campaign_params: false,
  save_referrer: false,
  session_recording: {
    blockSelector: "img, video, audio, canvas, iframe, object, embed",
    maskAllInputs: true,
    maskCapturedNetworkRequestFn: redactPostHogNetworkRequest,
    maskTextSelector: "*",
    recordBody: false,
    recordHeaders: false,
  },
} satisfies Partial<PostHogConfig>;
