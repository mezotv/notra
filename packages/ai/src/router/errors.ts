import type { GatewayId, RouterErrorCode } from "@notra/ai/types/router";

export class RouterError extends Error {
  readonly code: RouterErrorCode;
  readonly gateway?: GatewayId;

  constructor(code: RouterErrorCode, message: string, gateway?: GatewayId) {
    super(message);
    this.name = "RouterError";
    this.code = code;
    this.gateway = gateway;
  }
}

export class NoCompliantRouteError extends RouterError {
  constructor(modelId: string, detail: string) {
    super(
      "no_compliant_route",
      `No zero-data-retention compliant route available for model "${modelId}": ${detail}`
    );
    this.name = "NoCompliantRouteError";
  }
}

export class GatewayNotConfiguredError extends RouterError {
  constructor(gateway: GatewayId | "any") {
    super(
      "gateway_not_configured",
      gateway === "any"
        ? "No AI gateway is configured. Set AI_GATEWAY_API_KEY and/or OPENROUTER_API_KEY."
        : `AI gateway "${gateway}" is not configured.`,
      gateway === "any" ? undefined : gateway
    );
    this.name = "GatewayNotConfiguredError";
  }
}

export class UnsupportedModelError extends RouterError {
  readonly modelId: string;

  constructor(gateway: GatewayId, modelId: string) {
    super(
      "unsupported_model",
      `Model "${modelId}" is not supported by gateway "${gateway}".`,
      gateway
    );
    this.name = "UnsupportedModelError";
    this.modelId = modelId;
  }
}

export class GatewayCreditBalanceError extends RouterError {
  readonly balance: number;

  constructor(balance: number, gateway: GatewayId = "vercel") {
    super(
      "credit_balance",
      `AI gateway "${gateway}" credit balance is ${balance}. Add credits before running AI workflows.`,
      gateway
    );
    this.name = "GatewayCreditBalanceError";
    this.balance = balance;
  }
}

export class GatewayUnavailableError extends RouterError {
  constructor(gateway: GatewayId, reason: string) {
    super(
      "gateway_unavailable",
      `AI gateway "${gateway}" is unavailable: ${reason}`,
      gateway
    );
    this.name = "GatewayUnavailableError";
  }
}
