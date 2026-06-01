export function HeroGradient() {
  return (
    <div
      aria-hidden="true"
      className="-z-10 pointer-events-none absolute inset-x-0 top-0 h-screen"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 90%, var(--background) 40%, var(--primary) 100%)",
      }}
    />
  );
}
