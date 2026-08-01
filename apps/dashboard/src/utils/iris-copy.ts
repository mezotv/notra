import {
  IRIS_CAPABILITY_LABELS,
  IRIS_RUN_STATUS_LABELS,
  IRIS_SIGNAL_KIND_LABELS,
  IRIS_SIGNAL_STATUS_LABELS,
  IRIS_SLACK_TERMINAL_ERRORS,
  IRIS_TASK_STATUS_LABELS,
  IRIS_TRIGGER_LABELS,
} from "@/constants/iris";
import type {
  IrisDecisionCopy,
  IrisOutboxNotice,
  IrisRunOutboxView,
  IrisRunView,
} from "@/types/iris";

const SEPARATORS = /[.\-_]+/;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function titleCase(value: string): string {
  const words = value.split(SEPARATORS).filter((word) => word.length > 0);
  if (words.length === 0) {
    return value;
  }
  const [first = "", ...rest] = words;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
}

export function humanizeIrisCapability(capabilityName: string): string {
  return IRIS_CAPABILITY_LABELS[capabilityName] ?? titleCase(capabilityName);
}

export function humanizeIrisContentType(contentType: string): string {
  return titleCase(contentType);
}

export function humanizeIrisSignalKind(kind: string): string {
  return IRIS_SIGNAL_KIND_LABELS[kind] ?? titleCase(kind);
}

export function humanizeIrisTrigger(trigger: string): string {
  return IRIS_TRIGGER_LABELS[trigger] ?? titleCase(trigger);
}

export function humanizeIrisRunStatus(status: string): string {
  return IRIS_RUN_STATUS_LABELS[status] ?? titleCase(status);
}

export function humanizeIrisTaskStatus(status: string): string {
  return IRIS_TASK_STATUS_LABELS[status] ?? titleCase(status);
}

export function humanizeIrisSignalStatus(status: string): string {
  return IRIS_SIGNAL_STATUS_LABELS[status] ?? titleCase(status);
}

export function formatIrisRelativeTime(
  isoDate: string | null,
  now = Date.now()
): string {
  if (!isoDate) {
    return "Never";
  }

  const elapsed = now - new Date(isoDate).getTime();
  if (Number.isNaN(elapsed)) {
    return "Never";
  }
  if (elapsed < MINUTE_MS) {
    return "Just now";
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  }
  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(elapsed / DAY_MS);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function describeSignalCount(count: number): string {
  return count === 1 ? "1 signal" : `${count} signals`;
}

export function describeIrisDecision(run: IrisRunView): IrisDecisionCopy {
  if (run.status === "planning") {
    return { headline: "Iris is thinking it over", detail: run.reason };
  }

  if (run.decision === "no_op") {
    const reviewed = run.actions.length + run.tasks.length;
    return {
      headline:
        reviewed > 0
          ? `Reviewed ${describeSignalCount(reviewed)} and decided to wait`
          : "Reviewed the latest activity and decided to wait",
      detail: run.reason,
    };
  }

  if (run.decision === "escalate") {
    return { headline: "Asked for your input on Slack", detail: run.reason };
  }

  if (run.decision === "plan") {
    if (run.status === "failed") {
      return {
        headline: run.goal?.title
          ? `Plan did not finish: ${run.goal.title}`
          : "The plan did not finish",
        detail: run.reason ?? run.goal?.summary ?? null,
      };
    }
    if (run.status === "canceled") {
      return {
        headline: run.goal?.title
          ? `Run canceled: ${run.goal.title}`
          : "Run canceled",
        detail: run.reason ?? null,
      };
    }
    return {
      headline: run.goal?.title ?? "Iris put a plan together",
      detail: run.reason ?? run.goal?.summary ?? null,
    };
  }

  if (run.status === "failed") {
    return { headline: "Planning failed", detail: run.reason };
  }

  if (run.status === "canceled") {
    return { headline: "Run canceled", detail: run.reason };
  }

  return { headline: "Iris is getting to work", detail: run.reason };
}

export function describeIrisOutbox(
  messages: IrisRunOutboxView[]
): IrisOutboxNotice | null {
  const slackMessage = messages.find(
    (message) => message.destination === "slack"
  );
  if (!slackMessage) {
    return null;
  }

  if (slackMessage.status === "delivered") {
    return {
      tone: "info",
      message: "Reported to Slack",
      needsSlackFix: false,
    };
  }

  if (slackMessage.status === "failed") {
    const lastError = slackMessage.lastError ?? "";
    const needsSlackFix = IRIS_SLACK_TERMINAL_ERRORS.some((code) =>
      lastError.includes(code)
    );
    if (needsSlackFix) {
      return {
        tone: "warning",
        message:
          "Iris could not post to Slack. Pick a notification channel and invite Iris to it.",
        needsSlackFix: true,
      };
    }
    return {
      tone: "danger",
      message: `Slack delivery failed${lastError ? `: ${lastError}` : ""}`,
      needsSlackFix: false,
    };
  }

  if (slackMessage.status === "canceled") {
    return {
      tone: "info",
      message: "Slack report canceled",
      needsSlackFix: false,
    };
  }

  return {
    tone: "info",
    message: "Reporting to Slack",
    needsSlackFix: false,
  };
}

export function isIrisRunOpen(run: IrisRunView | null): boolean {
  return run?.status === "planning" || run?.status === "executing";
}
