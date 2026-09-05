import { beforeEach, describe, expect, mock, test } from "bun:test";

import {
  GEO_SCAN_NO_RESULTS_RETRY_DELAY,
  GEO_SCAN_SEQUENCE_BATCH_SIZE,
  GEO_SCAN_TASK_BATCH_SIZE,
} from "@notra/geo-core/constants/geo";
import { EMPTY_AGENT_TOKEN_USAGE } from "@notra/geo-core/utils/token-usage";
import { FatalError } from "workflow";

import type * as Steps from "../src/workflows/steps/geo-scan-steps";
import { scanPlan } from "./utils/geo-scan-plan";

const listProjects = mock<typeof Steps.listGeoScanProjectsStep>();
const prepare = mock<typeof Steps.prepareGeoScanProjectStep>();
const taskBatch = mock<typeof Steps.runGeoScanTaskBatchStep>();
const sequenceBatch = mock<typeof Steps.runGeoScanSequenceBatchStep>();
const finalize = mock<typeof Steps.finalizeGeoScanProjectStep>();
const trackRetry = mock<typeof Steps.trackGeoScanRetryScheduledStep>();
const sleep = mock(async (_delay: string) => undefined);
// These tests exercise orchestration decisions as ordinary functions. The
// durable runtime and model/billing steps have separate integration boundaries.
mock.module("workflow", () => ({ FatalError, sleep }));
mock.module("../src/workflows/steps/geo-scan-steps", () => ({
  listGeoScanProjectsStep: listProjects,
  prepareGeoScanProjectStep: prepare,
  runGeoScanTaskBatchStep: taskBatch,
  runGeoScanSequenceBatchStep: sequenceBatch,
  finalizeGeoScanProjectStep: finalize,
  trackGeoScanRetryScheduledStep: trackRetry,
}));
const { geoScanWorkflow } = await import("../src/workflows/geo-scan");

beforeEach(() => {
  for (const fn of [
    listProjects,
    prepare,
    taskBatch,
    sequenceBatch,
    finalize,
    trackRetry,
    sleep,
  ]) {
    fn.mockReset();
  }
  listProjects.mockResolvedValue(["project-test"]);
  prepare.mockImplementation(async (_org, projectId) => ({
    status: "planned",
    plan: scanPlan(projectId),
  }));
  taskBatch.mockImplementation(async (_context, batch, claimedAt) => ({
    checks: batch.length,
    mentions: 1,
    dropped: 0,
    usage: {
      ...EMPTY_AGENT_TOKEN_USAGE,
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    },
    claimedAt: new Date(Date.parse(claimedAt) + 1).toISOString(),
  }));
  sequenceBatch.mockImplementation(async (_context, batch, claimedAt) => ({
    checks: batch.length,
    mentions: 0,
    dropped: 0,
    usage: EMPTY_AGENT_TOKEN_USAGE,
    claimedAt: new Date(Date.parse(claimedAt) + 1).toISOString(),
  }));
  finalize.mockResolvedValue(undefined);
  trackRetry.mockResolvedValue(undefined);
  sleep.mockResolvedValue(undefined);
});

describe("GEO scan workflow orchestration", () => {
  test("invalid payloads do not reach project discovery", async () => {
    expect(await geoScanWorkflow({ organizationId: "" })).toEqual({
      status: "invalid_payload",
    });
    expect(listProjects).not.toHaveBeenCalled();
  });

  test("empty project discovery does not prepare, bill, or retry a scan", async () => {
    listProjects.mockResolvedValue([]);
    expect(await geoScanWorkflow({ organizationId: "org-test" })).toEqual({
      status: "skipped",
    });
    expect(prepare).not.toHaveBeenCalled();
    expect(taskBatch).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });

  test("a project whose preparation skips does not execute or finalize batches", async () => {
    prepare.mockResolvedValue({ status: "skipped", reason: "already_running" });
    expect(await geoScanWorkflow({ organizationId: "org-test" })).toEqual({
      status: "skipped",
    });
    expect(taskBatch).not.toHaveBeenCalled();
    expect(finalize).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });

  test("batches tasks and sequences, passes renewed tokens, and sums results and usage", async () => {
    const plan = scanPlan(
      "project-test",
      GEO_SCAN_TASK_BATCH_SIZE + 1,
      GEO_SCAN_SEQUENCE_BATCH_SIZE + 1
    );
    prepare.mockResolvedValue({ status: "planned", plan });
    const payload = {
      organizationId: "org-test",
      projectId: "project-test",
      scanId: "pending-scan",
      claimedAt: plan.claimedAt,
      promptIds: ["prompt-0"],
    };
    const result = await geoScanWorkflow(payload);
    expect(prepare).toHaveBeenCalledWith("org-test", "project-test", {
      scanId: "pending-scan",
      claimedAt: plan.claimedAt,
      promptIds: ["prompt-0"],
      retried: false,
    });
    expect(taskBatch.mock.calls.map(([, batch]) => batch.length)).toEqual([
      GEO_SCAN_TASK_BATCH_SIZE,
      1,
    ]);
    expect(sequenceBatch.mock.calls.map(([, batch]) => batch.length)).toEqual([
      GEO_SCAN_SEQUENCE_BATCH_SIZE,
      1,
    ]);
    const tokens = [...taskBatch.mock.calls, ...sequenceBatch.mock.calls].map(
      ([, , token]) => token
    );
    expect(tokens).toEqual(
      Array.from({ length: 4 }, (_, index) =>
        new Date(Date.parse(plan.claimedAt) + index).toISOString()
      )
    );
    expect(result).toEqual({
      status: "completed",
      checks: plan.tasks.length + plan.sequences.length,
      mentions: 2,
    });
    expect(finalize).toHaveBeenCalledWith(
      plan.context,
      {
        checks: plan.tasks.length + plan.sequences.length,
        mentions: 2,
        dropped: 0,
        usage: {
          ...EMPTY_AGENT_TOKEN_USAGE,
          inputTokens: 20,
          outputTokens: 10,
          totalTokens: 30,
        },
      },
      "completed",
      new Date(Date.parse(plan.claimedAt) + 4).toISOString(),
      { retried: false }
    );
    expect(sleep).not.toHaveBeenCalled();
  });

  test("finalizes a failed later batch with accumulated results and the last acquired token", async () => {
    const plan = scanPlan("project-test", GEO_SCAN_TASK_BATCH_SIZE + 1);
    prepare.mockResolvedValue({ status: "planned", plan });
    taskBatch.mockResolvedValueOnce({
      checks: 2,
      mentions: 1,
      dropped: 1,
      usage: EMPTY_AGENT_TOKEN_USAGE,
      claimedAt: "2026-09-01T00:00:00.001Z",
    });
    taskBatch.mockRejectedValueOnce(new Error("Engine unavailable"));
    expect(await geoScanWorkflow({ organizationId: "org-test" })).toEqual({
      status: "completed",
      checks: 2,
      mentions: 1,
    });
    expect(finalize).toHaveBeenCalledWith(
      plan.context,
      { checks: 2, mentions: 1, dropped: 1, usage: EMPTY_AGENT_TOKEN_USAGE },
      "failed",
      "2026-09-01T00:00:00.001Z",
      { retried: false, failureReason: "Error" }
    );
    expect(sequenceBatch).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });

  test("retries only projects without successful checks, acquiring a new scan rather than reusing the initial claim", async () => {
    listProjects.mockResolvedValue(["healthy", "empty"]);
    taskBatch.mockImplementation(async (context, _batch, claimedAt) => ({
      checks:
        context.projectId === "empty" && taskBatch.mock.calls.length <= 2
          ? 0
          : 1,
      mentions: 0,
      dropped: 0,
      usage: EMPTY_AGENT_TOKEN_USAGE,
      claimedAt,
    }));
    expect(
      await geoScanWorkflow({
        organizationId: "org-test",
        projectId: "empty",
        claimedAt: "2026-09-01T00:00:00.000Z",
        scanId: "old-scan",
        promptIds: ["prompt-0"],
      })
    ).toEqual({ status: "completed", checks: 2, mentions: 0 });
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(GEO_SCAN_NO_RESULTS_RETRY_DELAY);
    expect(trackRetry).toHaveBeenCalledWith(
      "org-test",
      ["empty"],
      1,
      expect.any(Number)
    );
    expect(
      prepare.mock.calls.map(([, id, options]) => [id, options.retried])
    ).toEqual([
      ["healthy", false],
      ["empty", false],
      ["empty", true],
    ]);
    expect(prepare.mock.calls[2]?.[2]).toEqual({
      retried: true,
      promptIds: ["prompt-0"],
    });
  });

  test("a second empty scan fails permanently instead of retrying indefinitely", async () => {
    taskBatch.mockResolvedValue({
      checks: 0,
      mentions: 0,
      dropped: 1,
      usage: EMPTY_AGENT_TOKEN_USAGE,
      claimedAt: "2026-09-01T00:00:00.000Z",
    });
    await expect(
      geoScanWorkflow({ organizationId: "org-test" })
    ).rejects.toBeInstanceOf(FatalError);
    expect(taskBatch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(finalize.mock.calls.map(([, , status]) => status)).toEqual([
      "failed",
      "failed",
    ]);
  });
});
