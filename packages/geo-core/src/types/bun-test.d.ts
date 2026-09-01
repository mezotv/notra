declare module "bun:test" {
  interface Matchers {
    toBe(expected: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toMatch(expected: RegExp): void;
  }

  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: unknown): Matchers & { not: Matchers };
}
