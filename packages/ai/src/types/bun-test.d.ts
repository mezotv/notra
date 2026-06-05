declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: unknown): {
    not: {
      toBe(expected: unknown): void;
    };
    toBe(expected: unknown): void;
    toBeLessThanOrEqual(expected: number): void;
    toMatch(expected: RegExp): void;
  };
}
