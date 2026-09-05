import { afterAll, beforeEach, expect, mock, test } from "bun:test";

const run = mock(async () => ({ failed: 0, emailsSent: 1 }));
mock.module("@/lib/email/daily-summary", () => ({ runDailySummaryCron: run }));
const { GET } = await import("./route");
const originalSecret = process.env.CRON_SECRET;

beforeEach(() => {
  process.env.CRON_SECRET = "test-secret";
  run.mockClear();
  run.mockResolvedValue({ failed: 0, emailsSent: 1 });
});

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalSecret;
  }
  mock.restore();
});

test("rejects unauthenticated requests without running the cron", async () => {
  const response = await GET(
    new Request("https://example.com/api/cron/daily-summary")
  );
  expect(response.status).toBe(401);
  expect(run).not.toHaveBeenCalled();
});

test("rejects requests when the secret is missing", async () => {
  delete process.env.CRON_SECRET;
  const response = await GET(
    new Request("https://example.com/api/cron/daily-summary", {
      headers: { authorization: "Bearer undefined" },
    })
  );
  expect(response.status).toBe(401);
  expect(run).not.toHaveBeenCalled();
});

test("reports partial send failures as HTTP failures", async () => {
  run.mockResolvedValue({ failed: 1, emailsSent: 1 });
  const response = await GET(
    new Request("https://example.com/api/cron/daily-summary", {
      headers: { authorization: "Bearer test-secret" },
    })
  );
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ failed: 1, emailsSent: 1 });
});

test("reports successful authenticated runs", async () => {
  const response = await GET(
    new Request("https://example.com/api/cron/daily-summary", {
      headers: { authorization: "Bearer test-secret" },
    })
  );
  expect(response.status).toBe(200);
  expect(run).toHaveBeenCalledTimes(1);
});
