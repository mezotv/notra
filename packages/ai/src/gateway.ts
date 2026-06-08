import { createGateway } from "@ai-sdk/gateway";
import type {
  GatewayArgs,
  GatewayClient,
  GatewayResult,
} from "@notra/ai/types/gateway";

const headers = {
  "http-referer": "https://www.usenotra.com",
  "x-title": "Notra",
};

let gatewayClient: GatewayClient | null = null;
let lastCreditCheck:
  | {
      checkedAt: number;
      balance: number;
    }
  | undefined;

const POSITIVE_CREDIT_CHECK_TTL_MS = 30_000;
const NEGATIVE_CREDIT_CHECK_TTL_MS = 30_000;

export class GatewayCreditBalanceError extends Error {
  constructor(balance: number) {
    super(
      `AI Gateway credit balance is ${balance}. Add credits before running AI workflows.`
    );
    this.name = "GatewayCreditBalanceError";
  }
}

function getGatewayClient(): GatewayClient {
  if (gatewayClient) {
    return gatewayClient;
  }

  gatewayClient = createGateway({ headers });
  return gatewayClient;
}

export const gateway = (...args: GatewayArgs): GatewayResult => {
  const client = getGatewayClient();
  return client(...args);
};

export async function assertGatewayHasCredits() {
  const now = Date.now();
  if (lastCreditCheck) {
    const ageMs = now - lastCreditCheck.checkedAt;
    if (lastCreditCheck.balance > 0 && ageMs < POSITIVE_CREDIT_CHECK_TTL_MS) {
      return;
    }
    if (lastCreditCheck.balance <= 0 && ageMs < NEGATIVE_CREDIT_CHECK_TTL_MS) {
      throw new GatewayCreditBalanceError(lastCreditCheck.balance);
    }
  }

  const client = getGatewayClient();
  const credits = await client.getCredits();
  const balance =
    typeof credits.balance === "number"
      ? credits.balance
      : Number(credits.balance);

  if (!Number.isFinite(balance)) {
    return;
  }

  lastCreditCheck = { checkedAt: now, balance };

  if (balance <= 0) {
    throw new GatewayCreditBalanceError(balance);
  }
}
