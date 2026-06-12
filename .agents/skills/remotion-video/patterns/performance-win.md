# Pattern: performance-win

## When to Use

- PR title contains perf keywords (ms, throughput, speedup, faster, Nx, N%)
- Benchmarks added or improved
- Bundle size reductions

## Scene Sequence (30s target)

1. **HookTitle** (0-3s) — Result pattern heavily preferred (specific number in the hook)
2. **ProblemSetup** (3-8s) — why old performance mattered (context, not apology)
3. **MetricCompare** (8-18s) — before/after numbers, large typography
4. **CodeSnippet** (18-25s, optional) — the one-line change that did it, if applicable
5. **CTAEndScreen** (25-30s)

## Code Handling

Optional code scene only if the performance win can be attributed to a simple config change or one-line code change. If the change is a complex internal rewrite, skip code and stay on the metric compare.

## Hook Pattern Bias

Strong fit:
- Result with a specific number (`"Fifty-millisecond cold starts"`)
- Comparison (`"10x faster than v1"`)

Avoid: Curiosity-gap. Perf stories land harder with the number upfront.

## Example

PR: rewrites the bundler to be 10x faster.

- HookTitle: `"Ten times faster builds"` (Result, 4 words)
- ProblemSetup: "Every save, a 3-second wait"
- MetricCompare: "3.2s → 0.3s" with large typography, colored bars
- CodeSnippet: (skip — internal rewrite)
- CTAEndScreen: "Upgrade now."
