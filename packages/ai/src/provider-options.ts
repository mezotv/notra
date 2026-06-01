import type { generateText } from "ai";

type ProviderOptions = NonNullable<
  Parameters<typeof generateText>[0]["providerOptions"]
>;

export function withGatewayAutomaticCaching(
  providerOptions?: ProviderOptions
): ProviderOptions {
  return {
    ...providerOptions,
    gateway: {
      ...providerOptions?.gateway,
      caching: "auto",
    },
  };
}
