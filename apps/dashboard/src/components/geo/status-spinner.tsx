export function StatusSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-3.5 motion-safe:animate-spin"
    >
      <svg
        aria-hidden="true"
        className="size-full"
        fill="none"
        viewBox="0 0 16 16"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d="M14 8A6 6 0 0 0 8 2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}
